import fs from 'node:fs';
import path from 'node:path';
import { Order, ORDER_STATUSES } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { RECEIPT_DIR } from '../middleware/upload.js';
import { releaseStock } from '../services/inventory.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { assertObjectId, cleanText, escapeRegex } from '../utils/validate.js';

const TRANSITIONS = {
  'Pending Payment Verification': ['Processing', 'Cancelled'],
  Processing: ['Shipped', 'Delivered', 'Cancelled'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

async function restockOrder(order) {
  if (order.stockRestored) return;
  const lines = order.items.map((i) => ({ productId: i.product.toString(), quantity: i.quantity }));
  await releaseStock(lines);
  order.stockRestored = true;
}

async function loadOrder(id) {
  assertObjectId(id, 'order id');
  const order = await Order.findById(id).populate('user', 'username email createdAt');
  if (!order) throw new AppError('Order not found.', 404);
  return order;
}

export const getStats = asyncHandler(async (_req, res) => {
  const [statusAgg, revenueAgg, customers, lowStock, recent] = await Promise.all([
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { 'paymentDetails.verified': true, status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' }, discounts: { $sum: '$discountApplied' }, orders: { $sum: 1 } } },
    ]),
    User.countDocuments({ role: 'customer' }),
    Product.find({ isActive: true, stock: { $lte: 5 } }).select('name stock imageUrl').sort({ stock: 1 }).limit(10),
    Order.find({}).sort({ createdAt: -1 }).limit(6).populate('user', 'username email'),
  ]);
  const byStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0]));
  statusAgg.forEach((s) => {
    byStatus[s._id] = s.count;
  });
  res.json({
    success: true,
    stats: {
      byStatus,
      totalOrders: Object.values(byStatus).reduce((a, b) => a + b, 0),
      verifiedRevenue: revenueAgg[0]?.revenue || 0,
      discountsGiven: revenueAgg[0]?.discounts || 0,
      verifiedOrders: revenueAgg[0]?.orders || 0,
      customers,
      lowStock,
      recent,
    },
  });
});

export const listOrders = asyncHandler(async (req, res) => {
  const { status, method, search } = req.query;
  const filter = {};
  if (status) {
    if (!ORDER_STATUSES.includes(status)) throw new AppError('Unknown status filter.', 400);
    filter.status = status;
  }
  if (method) {
    if (!['GCash', 'Maya'].includes(method)) throw new AppError('Unknown payment method filter.', 400);
    filter['paymentDetails.method'] = method;
  }
  if (search) {
    const term = cleanText(search, { max: 40 });
    if (term) {
      const rx = new RegExp(escapeRegex(term), 'i');
      filter.$or = [
        { orderNumber: rx },
        { 'paymentDetails.referenceNumber': rx },
        { 'paymentDetails.senderName': rx },
        { 'paymentDetails.senderNumber': rx },
        { 'shipping.fullName': rx },
      ];
    }
  }
  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(500).populate('user', 'username email');
  res.json({ success: true, count: orders.length, orders });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await loadOrder(req.params.id);
  const duplicateSenders = await Order.countDocuments({
    _id: { $ne: order._id },
    'paymentDetails.senderNumber': order.paymentDetails.senderNumber,
  });
  res.json({ success: true, order, insights: { otherOrdersFromSender: duplicateSenders } });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const order = await loadOrder(req.params.id);
  if (order.status !== 'Pending Payment Verification') {
    throw new AppError(`Order is already "${order.status}"; only pending payments can be verified.`, 409);
  }
  const confirmedReference = String(req.body?.confirmReferenceNumber || '').replace(/\s/g, '').toUpperCase();
  if (confirmedReference && confirmedReference !== order.paymentDetails.referenceNumber) {
    throw new AppError('Reference number does not match the customer submission. Check the GCash/Maya transaction history.', 400);
  }
  const note = cleanText(req.body?.note, { max: 300 });
  order.paymentDetails.verified = true;
  order.paymentDetails.verifiedAt = new Date();
  order.paymentDetails.verifiedBy = req.user._id;
  order.paymentDetails.rejectionReason = '';
  order.status = 'Processing';
  order.statusHistory.push({
    status: 'Processing',
    note: note || `Payment verified against ${order.paymentDetails.method} 09636688618 (Ref ${order.paymentDetails.referenceNumber}).`,
    changedBy: req.user._id,
  });
  await order.save();
  res.json({ success: true, order });
});

export const rejectPayment = asyncHandler(async (req, res) => {
  const order = await loadOrder(req.params.id);
  if (order.status !== 'Pending Payment Verification') {
    throw new AppError(`Order is already "${order.status}"; only pending payments can be rejected.`, 409);
  }
  const reason = cleanText(req.body?.reason, { max: 300 });
  if (reason.length < 5) throw new AppError('Please provide a rejection reason (min 5 characters).', 400);
  order.paymentDetails.verified = false;
  order.paymentDetails.rejectionReason = reason;
  order.status = 'Cancelled';
  await restockOrder(order);
  order.statusHistory.push({ status: 'Cancelled', note: `Payment rejected: ${reason}. Stock automatically restored.`, changedBy: req.user._id });
  await order.save();
  res.json({ success: true, order });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await loadOrder(req.params.id);
  const next = req.body?.status;
  if (!ORDER_STATUSES.includes(next)) throw new AppError('Invalid status.', 400);
  if (!TRANSITIONS[order.status].includes(next)) {
    throw new AppError(`Cannot move an order from "${order.status}" to "${next}".`, 409);
  }
  if (order.status === 'Pending Payment Verification' && next === 'Processing') {
    throw new AppError('Use payment verification to move a pending order to Processing.', 409);
  }
  const note = cleanText(req.body?.note, { max: 300 });
  order.status = next;
  if (next === 'Cancelled') await restockOrder(order);
  order.statusHistory.push({
    status: next,
    note: note || (next === 'Cancelled' ? 'Order cancelled by owner. Stock automatically restored.' : `Status updated to ${next}.`),
    changedBy: req.user._id,
  });
  await order.save();
  res.json({ success: true, order });
});

export const streamReceipt = asyncHandler(async (req, res) => {
  const filename = path.basename(String(req.params.filename || ''));
  if (!/^\d+-[a-f0-9]{32}\.(jpg|png|webp)$/.test(filename)) throw new AppError('Receipt not found.', 404);
  const filePath = path.join(RECEIPT_DIR, filename);
  try {
    await fs.promises.access(filePath, fs.constants.R_OK);
  } catch {
    throw new AppError('Receipt not found.', 404);
  }
  res.set('Cache-Control', 'private, no-store');
  res.set('X-Content-Type-Options', 'nosniff');
  res.sendFile(filePath);
});

export const listCustomers = asyncHandler(async (_req, res) => {
  const customers = await User.aggregate([
    { $match: { role: 'customer' } },
    { $lookup: { from: 'orders', localField: '_id', foreignField: 'user', as: 'orders' } },
    {
      $project: {
        username: 1,
        email: 1,
        createdAt: 1,
        lastLoginAt: 1,
        orderCount: { $size: '$orders' },
        totalSpent: {
          $sum: {
            $map: {
              input: { $filter: { input: '$orders', as: 'o', cond: { $eq: ['$$o.paymentDetails.verified', true] } } },
              as: 'v',
              in: '$$v.totalAmount',
            },
          },
        },
      },
    },
    { $sort: { createdAt: -1 } },
    { $limit: 1000 },
  ]);
  res.json({ success: true, count: customers.length, customers });
});
