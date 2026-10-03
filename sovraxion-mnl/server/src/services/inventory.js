import { Product } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';

/**
 * Atomically deducts stock for every product line. Each decrement is guarded by
 * a `stock >= qty` condition so concurrent checkouts can never oversell. If any
 * decrement fails, all prior decrements in this batch are reverted.
 */
export async function reserveStock(lines) {
  const applied = [];
  try {
    for (const line of lines) {
      // eslint-disable-next-line no-await-in-loop
      const updated = await Product.findOneAndUpdate(
        { _id: line.productId, isActive: true, stock: { $gte: line.quantity } },
        { $inc: { stock: -line.quantity, soldCount: line.quantity }, $set: { updatedAt: new Date() } },
        { new: true }
      );
      if (!updated) {
        // eslint-disable-next-line no-await-in-loop
        const current = await Product.findById(line.productId).select('name stock').lean();
        throw new AppError(
          current
            ? `Only ${current.stock} left of "${current.name}". Please update your cart.`
            : 'A product in your cart is no longer available.',
          409
        );
      }
      applied.push(line);
    }
    return applied;
  } catch (err) {
    await releaseStock(applied);
    throw err;
  }
}

export async function releaseStock(lines) {
  await Promise.all(
    lines.map((line) =>
      Product.updateOne(
        { _id: line.productId },
        { $inc: { stock: line.quantity, soldCount: -line.quantity }, $set: { updatedAt: new Date() } }
      )
    )
  );
}

export async function reserveFreebie(freebieId) {
  const updated = await Product.findOneAndUpdate(
    { _id: freebieId, stock: { $gte: 1 } },
    { $inc: { stock: -1, soldCount: 1 }, $set: { updatedAt: new Date() } },
    { new: true }
  );
  return Boolean(updated);
}
