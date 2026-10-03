import mongoose from 'mongoose';

export const ORDER_STATUSES = ['Pending Payment Verification', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
export const PAYMENT_METHODS = ['GCash', 'Maya'];

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: '' },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, max: 99 },
    size: { type: String, required: true, enum: ['XS', 'S', 'M', 'L', 'XL', 'One Size'] },
    lineTotal: { type: Number, required: true, min: 0 },
    isFreebie: { type: Boolean, default: false },
  },
  { _id: false }
);

const paymentDetailsSchema = new mongoose.Schema(
  {
    method: { type: String, enum: PAYMENT_METHODS, required: [true, 'Payment method is required.'] },
    merchantAccountName: { type: String, default: 'SOVRAXION MNL', immutable: true },
    merchantNumber: { type: String, default: '09636688618', immutable: true },
    senderName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    senderNumber: { type: String, required: true, trim: true, match: [/^(09|\+639)\d{9}$/, 'Sender mobile number is invalid.'] },
    referenceNumber: { type: String, required: true, trim: true, uppercase: true, match: [/^[A-Z0-9]{8,20}$/, 'Reference number is invalid.'] },
    receiptUrl: { type: String, required: [true, 'Payment receipt screenshot is required.'] },
    amountPaid: { type: Number, required: true, min: 0 },
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rejectionReason: { type: String, default: '', maxlength: 300 },
  },
  { _id: false }
);

const shippingSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, trim: true, match: [/^(09|\+639)\d{9}$/, 'Contact number is invalid.'] },
    addressLine: { type: String, required: true, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    province: { type: String, required: true, trim: true, maxlength: 80 },
    postalCode: { type: String, required: true, trim: true, match: [/^\d{4}$/, 'Postal code must be 4 digits.'] },
    notes: { type: String, default: '', trim: true, maxlength: 300 },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    note: { type: String, default: '', maxlength: 300 },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: {
      type: [orderItemSchema],
      validate: { validator: (v) => Array.isArray(v) && v.length > 0, message: 'Order must contain at least one item.' },
    },
    subtotal: { type: Number, required: true, min: 0 },
    discountRate: { type: Number, required: true, min: 0, max: 1, default: 0 },
    discountApplied: { type: Number, required: true, min: 0, default: 0 },
    discountTier: { type: String, default: '' },
    freebies: { type: [String], default: [] },
    totalAmount: { type: Number, required: true, min: 0 },
    shipping: { type: shippingSchema, required: true },
    paymentDetails: { type: paymentDetailsSchema, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'Pending Payment Verification', index: true },
    statusHistory: { type: [statusHistorySchema], default: [] },
    stockRestored: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, immutable: true, index: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

orderSchema.index(
  { 'paymentDetails.method': 1, 'paymentDetails.referenceNumber': 1 },
  { unique: true, name: 'unique_payment_reference' }
);

orderSchema.pre('save', function touch() {
  this.updatedAt = new Date();
});

orderSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
