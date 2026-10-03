import { Product, PRODUCT_CATEGORIES, PRODUCT_SIZES } from '../models/Product.js';
import { PRODUCT_IMAGE_DIR, persistImage } from '../middleware/upload.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { slugify } from '../utils/slugify.js';
import { assertObjectId, cleanMultiline, cleanText, escapeRegex, isValidObjectId, toMoney } from '../utils/validate.js';

const SORTS = {
  newest: { createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  popular: { soldCount: -1, createdAt: -1 },
  name: { name: 1 },
};

function parseProductInput(body, { partial = false } = {}) {
  const out = {};
  const errors = {};

  const has = (k) => body[k] !== undefined && body[k] !== null && body[k] !== '';

  if (has('name') || !partial) {
    const name = cleanText(body.name, { max: 120 });
    if (name.length < 2) errors.name = 'Name must be at least 2 characters.';
    else out.name = name;
  }
  if (has('description') || !partial) {
    const description = cleanMultiline(body.description, { max: 4000 });
    if (description.length < 10) errors.description = 'Description must be at least 10 characters.';
    else out.description = description;
  }
  if (has('price') || !partial) {
    const price = toMoney(body.price, { min: 1 });
    if (price === null) errors.price = 'Price must be a number between ₱1 and ₱1,000,000.';
    else out.price = price;
  }
  if (body.compareAtPrice !== undefined) {
    if (body.compareAtPrice === null || body.compareAtPrice === '' || Number(body.compareAtPrice) === 0) out.compareAtPrice = null;
    else {
      const cap = toMoney(body.compareAtPrice, { min: 1 });
      if (cap === null) errors.compareAtPrice = 'Compare-at price is invalid.';
      else out.compareAtPrice = cap;
    }
  }
  if (has('category') || !partial) {
    if (!PRODUCT_CATEGORIES.includes(body.category)) errors.category = `Category must be one of ${PRODUCT_CATEGORIES.join(', ')}.`;
    else out.category = body.category;
  }
  if (has('collectionName')) out.collectionName = cleanText(body.collectionName, { max: 60 }) || 'Core';
  if (body.sizes !== undefined || !partial) {
    const sizes = Array.isArray(body.sizes) ? [...new Set(body.sizes)] : [];
    if (!sizes.length || !sizes.every((s) => PRODUCT_SIZES.includes(s))) errors.sizes = 'Select at least one valid size.';
    else out.sizes = sizes;
  }
  if (has('stock') || !partial) {
    const stock = Number(body.stock);
    if (!Number.isInteger(stock) || stock < 0 || stock > 100000) errors.stock = 'Stock must be a whole number from 0 to 100,000.';
    else out.stock = stock;
  }
  if (has('imageUrl') || !partial) {
    const url = cleanText(body.imageUrl, { max: 500 });
    const okUrl = /^\/(uploads\/products|products)\/[A-Za-z0-9._-]+$/.test(url) || /^https:\/\/[^\s"'<>]+$/.test(url);
    if (!okUrl) errors.imageUrl = 'Image must be an uploaded image or an https:// URL.';
    else out.imageUrl = url;
  }
  if (body.isFeatured !== undefined) out.isFeatured = Boolean(body.isFeatured);
  if (body.isActive !== undefined) out.isActive = Boolean(body.isActive);

  if (out.compareAtPrice && out.price && out.compareAtPrice <= out.price) {
    errors.compareAtPrice = 'Compare-at price must be greater than the selling price.';
  }

  if (Object.keys(errors).length) throw new AppError(Object.values(errors)[0], 400, errors);
  return out;
}

async function uniqueSlug(name, excludeId = null) {
  const base = slugify(name) || 'product';
  let candidate = base;
  let i = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await Product.exists(excludeId ? { slug: candidate, _id: { $ne: excludeId } } : { slug: candidate })) {
    candidate = `${base}-${i}`.slice(0, 80);
    i += 1;
  }
  return candidate;
}

export const listProducts = asyncHandler(async (req, res) => {
  const { category, collection, search, sort, sale, featured, inStock } = req.query;
  const filter = { isActive: true, isFreebie: { $ne: true } };

  if (category) {
    if (!PRODUCT_CATEGORIES.includes(category)) throw new AppError('Unknown category.', 400);
    filter.category = category;
  }
  if (collection) filter.collectionName = cleanText(collection, { max: 60 });
  if (sale === 'true') filter.compareAtPrice = { $ne: null };
  if (featured === 'true') filter.isFeatured = true;
  if (inStock === 'true') filter.stock = { $gt: 0 };
  if (search) {
    const term = cleanText(search, { max: 60 });
    if (term) {
      const rx = new RegExp(escapeRegex(term), 'i');
      filter.$or = [{ name: rx }, { description: rx }, { collectionName: rx }, { category: rx }];
    }
  }

  const products = await Product.find(filter).sort(SORTS[sort] || SORTS.newest).limit(200);
  const collections = await Product.distinct('collectionName', { isActive: true, isFreebie: { $ne: true } });
  res.json({ success: true, count: products.length, products, collections: collections.sort() });
});

export const getProduct = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const query = isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: slugify(idOrSlug) };
  const product = await Product.findOne({ ...query, isActive: true });
  if (!product) throw new AppError('Product not found.', 404);
  const related = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
    isActive: true,
    isFreebie: { $ne: true },
  })
    .sort({ soldCount: -1 })
    .limit(4);
  res.json({ success: true, product, related });
});

export const adminListProducts = asyncHandler(async (_req, res) => {
  const products = await Product.find({}).sort({ createdAt: -1 });
  res.json({ success: true, count: products.length, products });
});

export const createProduct = asyncHandler(async (req, res) => {
  const data = parseProductInput(req.body || {});
  data.slug = await uniqueSlug(data.name);
  const product = await Product.create(data);
  res.status(201).json({ success: true, product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const id = assertObjectId(req.params.id, 'product id');
  const product = await Product.findById(id);
  if (!product) throw new AppError('Product not found.', 404);
  const data = parseProductInput(req.body || {}, { partial: true });
  if (data.name && data.name !== product.name) data.slug = await uniqueSlug(data.name, product._id);
  Object.assign(product, data);
  await product.save();
  res.json({ success: true, product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const id = assertObjectId(req.params.id, 'product id');
  const product = await Product.findById(id);
  if (!product) throw new AppError('Product not found.', 404);
  if (product.isFreebie) throw new AppError('The freebie product cannot be removed; set its stock instead.', 400);
  product.isActive = false;
  await product.save();
  res.json({ success: true, message: 'Product archived and hidden from the storefront.', product });
});

export const uploadProductImage = asyncHandler(async (req, res) => {
  const filename = await persistImage(req.file, PRODUCT_IMAGE_DIR);
  res.status(201).json({ success: true, imageUrl: `/uploads/products/${filename}` });
});
