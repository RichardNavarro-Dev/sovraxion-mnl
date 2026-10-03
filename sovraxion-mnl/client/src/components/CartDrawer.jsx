import { AnimatePresence, motion } from 'framer-motion';
import { Gift, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { resolveImage } from '../lib/api';
import { DISCOUNT_TIERS } from '../lib/discounts';
import { formatPeso } from '../lib/format';
import { useLockBody } from '../lib/hooks';
import { useAuthStore } from '../store/useAuthStore';
import { selectCount, useCartStore, useCartTotals } from '../store/useCartStore';
import { useUIStore } from '../store/useUIStore';

const MAX_THRESHOLD = Math.max(...DISCOUNT_TIERS.map((t) => t.threshold));
const ASC = [...DISCOUNT_TIERS].sort((a, b) => a.threshold - b.threshold);

export function TierProgress({ totals }) {
  const pct = Math.min(100, (totals.subtotal / MAX_THRESHOLD) * 100);
  return (
    <div data-testid="tier-progress">
      <p className="text-xs text-white/70" data-testid="text-tier-message">
        {totals.nextTier ? (
          <>
            Add <span className="font-semibold text-gold">{formatPeso(totals.amountToNextTier)}</span> more to unlock{' '}
            <span className="text-bone">{totals.nextTier.label}</span>
          </>
        ) : (
          <span className="text-gold">Maximum tier unlocked — 15% off + free Puzzled Keychain</span>
        )}
      </p>
      <div className="relative mt-3 h-1.5 bg-white/10">
        <motion.div className="absolute inset-y-0 left-0 bg-gold-grad" initial={false} animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
        {ASC.map((t) => (
          <span
            key={t.id}
            className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border ${
              totals.subtotal >= t.threshold ? 'border-gold-bright bg-gold-bright' : 'border-white/30 bg-onyx-800'
            }`}
            style={{ left: `${(t.threshold / MAX_THRESHOLD) * 100}%` }}
            aria-hidden="true"
          />
        ))}
      </div>
      <div className="relative mt-2 h-4 text-[10px] text-white/40">
        {ASC.map((t) => (
          <span key={t.id} className="absolute -translate-x-1/2 last:-translate-x-full" style={{ left: `${(t.threshold / MAX_THRESHOLD) * 100}%` }}>
            {Math.round(t.rate * 100)}%
          </span>
        ))}
      </div>
    </div>
  );
}

export function OrderSummary({ totals, compact = false }) {
  return (
    <dl className={`space-y-2 text-sm ${compact ? '' : 'border-t border-white/10 pt-4'}`} data-testid="order-summary">
      <div className="flex justify-between text-white/70">
        <dt>Subtotal</dt>
        <dd data-testid="text-subtotal">{formatPeso(totals.subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-white/70">
          Stacked Payday {totals.tier ? <span className="text-gold">(Tier {totals.tier.id} · {Math.round(totals.discountRate * 100)}%)</span> : ''}
        </dt>
        <dd className={totals.discountAmount > 0 ? 'text-gold' : 'text-white/40'} data-testid="text-discount">
          {totals.discountAmount > 0 ? `−${formatPeso(totals.discountAmount)}` : '—'}
        </dd>
      </div>
      {totals.freebieEligible && (
        <div className="flex justify-between text-gold-pale" data-testid="text-freebie">
          <dt className="flex items-center gap-1.5"><Gift className="h-4 w-4" /> Puzzled Keychain</dt>
          <dd>FREE</dd>
        </div>
      )}
      <div className="flex justify-between text-white/70">
        <dt>Shipping</dt>
        <dd className="text-white/50">Paid to courier on delivery</dd>
      </div>
      <div className="flex items-baseline justify-between border-t border-white/10 pt-3">
        <dt className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-bone">Total to pay</dt>
        <dd className="font-display text-2xl font-semibold text-gold-grad" data-testid="text-total">{formatPeso(totals.total)}</dd>
      </div>
    </dl>
  );
}

export default function CartDrawer() {
  const open = useUIStore((s) => s.cartOpen);
  const setCart = useUIStore((s) => s.setCart);
  const setCheckout = useUIStore((s) => s.setCheckout);
  const openAuth = useUIStore((s) => s.openAuth);
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const count = useCartStore(selectCount);
  const totals = useCartTotals();
  const user = useAuthStore((s) => s.user);

  useLockBody(open);

  const checkout = () => {
    if (!items.length) return;
    if (!user) {
      setCart(false);
      openAuth('login', 'checkout');
      return;
    }
    setCheckout(true);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCart(false)}
            aria-hidden="true"
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-[71] flex w-full max-w-md flex-col border-l border-gold/20 bg-onyx-900"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping bag"
            onKeyDown={(e) => e.key === 'Escape' && setCart(false)}
            data-testid="drawer-cart"
          >
            <header className="flex h-16 items-center justify-between border-b border-white/10 px-5">
              <p className="font-display text-sm font-semibold uppercase tracking-[0.24em] text-bone">
                Your bag <span className="text-gold">({count})</span>
              </p>
              <button onClick={() => setCart(false)} className="p-2 text-white/60 hover:text-gold" aria-label="Close bag" data-testid="button-close-cart">
                <X className="h-5 w-5" />
              </button>
            </header>

            {items.length > 0 && (
              <div className="border-b border-white/10 bg-onyx-800 px-5 py-4">
                <TierProgress totals={totals} />
              </div>
            )}

            <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <ShoppingBag className="h-10 w-10 text-gold/60" aria-hidden="true" />
                  <p className="font-display text-lg font-semibold text-bone">Your bag is empty</p>
                  <p className="max-w-xs text-sm text-white/50">Stack ₱750 or more to unlock Stacked Payday savings automatically.</p>
                  <Link to="/shop" onClick={() => setCart(false)} className="btn-gold mt-2" data-testid="link-empty-cart-shop">Start shopping</Link>
                </div>
              ) : (
                <ul className="divide-y divide-white/5">
                  {items.map((item) => (
                    <li key={item.key} className="flex gap-4 py-4" data-testid={`row-cart-${item.key}`}>
                      <img src={resolveImage(item.imageUrl)} alt="" className="h-28 w-20 flex-none object-cover" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-display text-sm font-semibold uppercase tracking-wide text-bone">{item.name}</p>
                            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/45">Size {item.size}</p>
                          </div>
                          <button onClick={() => removeItem(item.key)} className="p-1 text-white/40 hover:text-red-300" aria-label={`Remove ${item.name}`} data-testid={`button-remove-${item.key}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-3">
                          <div className="flex h-9 items-center border border-white/10">
                            <button
                              onClick={() => (item.quantity <= 1 ? removeItem(item.key) : setQuantity(item.key, item.quantity - 1))}
                              className="flex h-full w-9 items-center justify-center text-white/70 hover:text-gold"
                              aria-label="Decrease quantity"
                              data-testid={`button-decrease-${item.key}`}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm tabular-nums" data-testid={`text-qty-${item.key}`}>{item.quantity}</span>
                            <button
                              onClick={() => setQuantity(item.key, item.quantity + 1)}
                              className="flex h-full w-9 items-center justify-center text-white/70 hover:text-gold disabled:opacity-30"
                              disabled={item.quantity >= Math.min(20, item.stock)}
                              aria-label="Increase quantity"
                              data-testid={`button-increase-${item.key}`}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="text-sm font-semibold text-gold">{formatPeso(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                  {totals.freebieEligible && (
                    <li className="flex items-center gap-4 py-4" data-testid="row-cart-freebie">
                      <img src="./products/p-puzzled-keychain.jpg" alt="" className="h-20 w-20 flex-none object-cover" />
                      <div className="flex-1">
                        <p className="font-display text-sm font-semibold uppercase tracking-wide text-gold-pale">Free Puzzled Keychain</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/45">Auto-added · Tier {totals.tier.id} reward</p>
                      </div>
                      <p className="text-sm font-semibold text-gold">FREE</p>
                    </li>
                  )}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <footer className="space-y-4 border-t border-white/10 bg-onyx-800 px-5 py-5">
                <OrderSummary totals={totals} compact />
                <button onClick={checkout} className="btn-gold w-full" data-testid="button-checkout">
                  {user ? 'Checkout with GCash / Maya' : 'Sign in to checkout'}
                </button>
                <p className="flex items-center justify-center gap-1.5 text-[11px] text-white/40">
                  <ShieldCheck className="h-3.5 w-3.5 text-gold/70" /> Payments verified manually by the SOVRAXION MNL owner
                </p>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
