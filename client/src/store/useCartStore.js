import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { computeTotals } from '../lib/discounts';
import { safeStorage } from '../lib/safeStorage';

const MAX_PER_LINE = 20;

const lineKey = (productId, size) => `${productId}::${size}`;

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem(product, size, quantity = 1) {
        if (!product?.id || !size) return { ok: false, message: 'Please select a size.' };
        if (product.stock <= 0) return { ok: false, message: 'This item is sold out.' };
        const key = lineKey(product.id, size);
        const items = [...get().items];
        const existing = items.find((i) => i.key === key);
        const sameProductQty = items.filter((i) => i.productId === product.id).reduce((s, i) => s + i.quantity, 0);
        if (sameProductQty + quantity > product.stock) {
          return { ok: false, message: `Only ${product.stock} left in stock.` };
        }
        if (existing) {
          if (existing.quantity + quantity > MAX_PER_LINE) return { ok: false, message: `Max ${MAX_PER_LINE} per size.` };
          existing.quantity += quantity;
          existing.price = product.price;
          existing.stock = product.stock;
        } else {
          items.push({
            key,
            productId: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            category: product.category,
            size,
            quantity,
            stock: product.stock,
          });
        }
        set({ items: items.map((i) => ({ ...i })) });
        return { ok: true };
      },

      setQuantity(key, quantity) {
        const items = get().items;
        const line = items.find((i) => i.key === key);
        if (!line) return;
        const q = Math.max(1, Math.min(MAX_PER_LINE, Math.floor(Number(quantity) || 1)));
        const otherQty = items.filter((i) => i.productId === line.productId && i.key !== key).reduce((s, i) => s + i.quantity, 0);
        const allowed = Math.max(1, Math.min(q, (line.stock || MAX_PER_LINE) - otherQty));
        set({ items: items.map((i) => (i.key === key ? { ...i, quantity: allowed } : i)) });
      },

      removeItem(key) {
        set({ items: get().items.filter((i) => i.key !== key) });
      },

      syncWithCatalog(products) {
        const byId = new Map(products.map((p) => [p.id, p]));
        const items = get()
          .items.filter((i) => byId.has(i.productId) && byId.get(i.productId).stock > 0)
          .map((i) => {
            const p = byId.get(i.productId);
            return { ...i, price: p.price, stock: p.stock, name: p.name, imageUrl: p.imageUrl, quantity: Math.min(i.quantity, p.stock) };
          });
        set({ items });
      },

      clear() {
        set({ items: [] });
      },
    }),
    {
      name: 'sovx-cart-v1',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ items: state.items }),
      version: 1,
    }
  )
);

export const selectCount = (state) => state.items.reduce((s, i) => s + i.quantity, 0);
export const selectSubtotal = (state) => state.items.reduce((s, i) => s + i.price * i.quantity, 0);

export function useCartTotals() {
  const subtotal = useCartStore(selectSubtotal);
  return computeTotals(subtotal);
}
