import mongoose from 'mongoose';

export const PRODUCT_CATEGORIES = ['Tees', 'Hoodies', 'Bottoms', 'Accessories', 'Collectibles'];
export const PRODUCT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'One Size'];

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required.'],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]{2,80}$/, 'Slug is invalid.'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required.'],
      trim: true,
      maxlength: 4000,
    },
    price: {
      type: Number,
      required: [true, 'Price (PHP) is required.'],
      min: [0, 'Price cannot be negative.'],
      max: 1000000,
    },
    compareAtPrice: {
      type: Number,
      min: 0,
      max: 1000000,
      default: null,
      validate: {
        validator(v) {
          return v === null || v === undefined || v > this.price;
        },
        message: 'Compare-at price must be greater than the selling price.',
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required.'],
      enum: { values: PRODUCT_CATEGORIES, message: 'Category is invalid.' },
    },
    collectionName: { type: String, trim: true, maxlength: 60, default: 'Core' },
    sizes: {
      type: [{ type: String, enum: PRODUCT_SIZES }],
      default: ['XS', 'S', 'M', 'L', 'XL'],
      validate: { validator: (v) => Array.isArray(v) && v.length > 0, message: 'At least one size is required.' },
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative.'],
      default: 0,
      validate: { validator: Number.isInteger, message: 'Stock must be a whole number.' },
    },
    soldCount: { type: Number, default: 0, min: 0 },
    imageUrl: { type: String, required: [true, 'Image URL is required.'], trim: true, maxlength: 500 },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isFreebie: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, immutable: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text' });

productSchema.pre('save', function touch() {
  this.updatedAt = new Date();
});

productSchema.virtual('onSale').get(function onSale() {
  return Boolean(this.compareAtPrice && this.compareAtPrice > this.price);
});

productSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
