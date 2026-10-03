import { env } from '../config/env.js';
import { nextSequence } from '../models/Counter.js';
import { Order, PAYMENT_METHODS } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { RECEIPT_DIR, persistImage, removeFileQuietly } from '../middleware/upload.js';
import { releaseStock, reserveFreebie, reserveStock } from '../services/inventory.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { FREEBIE_SLUG, computeTotals } from '../utils/discounts.js';
import {
  PH_MOBILE_RE,
  REFERENCE_RE,
  cleanText,
  isValidObjectId,
  normalizeMobile,
  toPositiveInt,
} from '../utils/validate.js';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'One Size'];

function parsePayload(raw) {
  if (typeof raw !== 'string' || raw.length > 60000) throw new AppError('Order payload is missing or too large.', 400);
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('bad');
    return parsed;
  } catch {
    throw new AppError('Order payload is not valid JSON.', 400);
  }
}

function validateCheckout(payload) {
  const errors = {};
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!items.length) errors.items = 'Your cart is empty.';
  if (items.length > 30) errors.items = 'Too many different items in a single order (max 30).';

  const normalizedItems = [];
  items.forEach((item, idx) => {
    const productId = typeof item?.productId === 'string' ? item.productId : '';
    const quantity = toPositiveInt(item?.quantity, { min: 1, max: 20 });
    const size = typeof item?.size === 'string' ? item.size : '';
    if (!isValidObjectId(productId)) errors[`items.${idx}.productId`] = 'Invalid product in cart.';
    if (quantity === null) errors[`items.${idx}.quantity`] = 'Quantity must be between 1 and 20.';
    if (!SIZES.includes(size)) errors[`items.${idx}.size`] = 'Please select a valid size.';
    normalizedItems.push({ productId, quantity, size });
  });

  const pay = payload.payment || {};
  const method = PAYMENT_METHODS.includes(pay.method) ? pay.method : null;
  if (!method) errors['payment.method'] = 'Choose GCash or Maya.';
  const senderName = cleanText(pay.senderName, { max: 80 });
  if (senderName.length < 2 || !/^[\p{L} .'-]+$/u.test(senderName)) errors['payment.senderName'] = 'Enter the sender name exactly as shown in your e-wallet.';
  const senderNumber = normalizeMobile(pay.senderNumber);
  if (!PH_MOBILE_RE.test(senderNumber)) errors['payment.senderNumber'] = 'Sender number must be a valid PH mobile (09XXXXXXXXX).';
  const referenceNumber = String(pay.referenceNumber || '').replace(/\s/g, '').toUpperCase();
  if (!REFERENCE_RE.test(referenceNumber)) errors['payment.referenceNumber'] = 'Reference number must be 8-20 letters/digits.';

  const ship = payload.shipping || {};
  const shipping = {
    fullName: cleanText(ship.fullName, { max: 80 }),
    phone: normalizeMobile(ship.phone),
    addressLine: cleanText(ship.addressLine, { max: 200 }),
    city: cleanText(ship.city, { max: 80 }),
    province: cleanText(ship.province, { max: 80 }),
    postalCode: cleanText(ship.postalCode, { max: 4 }),
    notes: cleanText(ship.notes, { max: 300 }),
  };
  if (shipping.fullName.length < 2) errors['shipping.fullName'] = 'Full name is required.';
  if (!PH_MOBILE_RE.test(shipping.phone)) errors['shipping.phone'] = 'Contact number must be a valid PH mobile.';
  if (shipping.addressLine.length < 5) errors['shipping.addressLine'] = 'Complete street address is required.';
  if (shipping.city.length < 2) errors['shipping.city'] = 'City / municipality is required.';
  if (shipping.province.length < 2) errors['shipping.province'] = 'Province / region is required.';
  if (!/^\d{4}$/.test(shipping.postalCode)) errors['shipping.postalCode'] = 'Postal code must be 4 digits.';

  const expectedTotal = payload.expectedTotal === undefined ? null : Number(payload.expectedTotal);

  if (Object.keys(errors).length) throw new AppError(Object.values(errors)[0], 400, errors);

  return {
    items: normalizedItems,
    payment: { method, senderName, senderNumber, referenceNumber },
    shipping,
    expectedTotal: Number.isFinite(expectedTotal) ? expectedTotal : null,
  };
}

function mergeLines(items) {
  const map = new Map();
  for (const item of items) {
    const key = `${item.productId}::${item.size}`;
    const existing = map.get(key);
    if (existing) existing.quantity += item.quantity;
    else map.set(key, { ...item });
  }
  return [...map.values()];
}

export const createOrder = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Please attach a screenshot of your GCash/Maya payment receipt.', 400);

  const checkout = validateCheckout(parsePayload(req.body?.order));
  const lines = mergeLines(checkout.items);

  const duplicate = await Order.exists({
    'paymentDetails.method': checkout.payment.method,
    'paymentDetails.referenceNumber': checkout.payment.referenceNumber,
  });
  if (duplicate) throw new AppError('This payment reference number has already been used for another order.', 409);

  const productIds = [...new Set(lines.map((l) => l.productId))];
  const products = await Product.find({ _id: { $in: productIds }, isActive: true, isFreebie: { $ne: true } });
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const orderItems = [];
  const stockLines = new Map();
  for (const line of lines) {
    const product = byId.get(line.productId);
    if (!product) throw new AppError('One of the products in your cart is no longer available.', 409);
    if (!product.sizes.includes(line.size)) throw new AppError(`Size ${line.size} is not available for "${product.name}".`, 400);
    if (line.quantity > 20) throw new AppError('Maximum of 20 pieces per item.', 400);
    orderItems.push({
      product: product._id,
      name: product.name,
      imageUrl: product.imageUrl,
      unitPrice: product.price,
      quantity: line.quantity,
      size: line.size,
      lineTotal: Math.round(product.price * line.quantity * 100) / 100,
      isFreebie: false,
    });
    const agg = stockLines.get(line.productId) || { productId: line.productId, quantity: 0 };
    agg.quantity += line.quantity;
    stockLines.set(line.productId, agg);
  }

  const subtotal = orderItems.reduce((sum, i) => sum + i.lineTotal, 0);
  const totals = computeTotals(subtotal);

  if (checkout.expectedTotal !== null && Math.abs(checkout.expectedTotal - totals.total) > 0.01) {
    throw new AppError(
      `Prices were updated. Your new total is ₱${totals.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}. Please review your cart before paying.`,
      409,
      { total: totals.total }
    );
  }

  const reserved = await reserveStock([...stockLines.values()]);
  let freebieReserved = null;
  let receiptFile = null;

  try {
    const freebies = [];
    if (totals.freebieEligible) {
      const freebie = await Product.findOne({ slug: FREEBIE_SLUG, isFreebie: true });
      if (freebie && (await reserveFreebie(freebie._id))) {
        freebieReserved = { productId: freebie._id.toString(), quantity: 1 };
        orderItems.push({
          product: freebie._id,
          name: freebie.name,
          imageUrl: freebie.imageUrl,
          unitPrice: 0,
          quantity: 1,
          size: 'One Size',
          lineTotal: 0,
          isFreebie: true,
        });
        freebies.push(freebie.name);
      } else {
        freebies.push('Puzzled Keychain (out of stock — store will contact you)');
      }
    }

    receiptFile = await persistImage(req.file, RECEIPT_DIR);
    const seq = await nextSequence('order');
    const orderNumber = `SVX-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;

    const order = await Order.create({
      orderNumber,
      user: req.user._id,
      items: orderItems,
      subtotal: totals.subtotal,
      discountRate: totals.discountRate,
      discountApplied: totals.discountAmount,
      discountTier: totals.tier ? totals.tier.label : '',
      freebies,
      totalAmount: totals.total,
      shipping: checkout.shipping,
      paymentDetails: {
        method: checkout.payment.method,
        merchantAccountName: env.MERCHANT.accountName,
        merchantNumber: env.MERCHANT.accountNumber,
        senderName: checkout.payment.senderName,
        senderNumber: checkout.payment.senderNumber,
        referenceNumber: checkout.payment.referenceNumber,
        receiptUrl: `/api/admin/receipts/${receiptFile}`,
        amountPaid: totals.total,
      },
      status: 'Pending Payment Verification',
      statusHistory: [{ status: 'Pending Payment Verification', note: 'Order placed; awaiting payment verification.', changedBy: req.user._id }],
    });

    res.status(201).json({ success: true, order: sanitizeOrderForCustomer(order) });
  } catch (err) {
    await releaseStock(reserved);
    if (freebieReserved) await releaseStock([freebieReserved]);
    if (receiptFile) await removeFileQuietly(RECEIPT_DIR, receiptFile);
    throw err;
  }
});

export function sanitizeOrderForCustomer(order) {
  const o = typeof order.toJSON === 'function' ? order.toJSON() : order;
  const { paymentDetails, statusHistory, stockRestored, ...rest } = o;
  return {
    ...rest,
    paymentDetails: {
      method: paymentDetails.method,
      merchantAccountName: paymentDetails.merchantAccountName,
      merchantNumber: paymentDetails.merchantNumber,
      senderName: paymentDetails.senderName,
      referenceNumber: paymentDetails.referenceNumber,
      amountPaid: paymentDetails.amountPaid,
      verified: paymentDetails.verified,
      rejectionReason: paymentDetails.rejectionReason,
    },
    statusHistory: (statusHistory || []).map(({ status, note, at }) => ({ status, note, at })),
  };
}

export const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, orders: orders.map(sanitizeOrderForCustomer) });
});
