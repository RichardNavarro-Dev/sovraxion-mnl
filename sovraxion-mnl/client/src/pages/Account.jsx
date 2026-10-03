import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, LogOut, Package, RefreshCw } from 'lucide-react';
import { resolveImage } from '../lib/api';
import { formatDate, formatPeso } from '../lib/format';
import { useApi } from '../lib/hooks';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';

export const STATUS_STYLES = {
  'Pending Payment Verification': 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  Processing: 'border-sky-400/40 bg-sky-400/10 text-sky-200',
  Shipped: 'border-violet-400/40 bg-violet-400/10 text-violet-200',
  Delivered: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
  Cancelled: 'border-red-400/40 bg-red-400/10 text-red-200',
};

export function StatusBadge({ status }) {
  return <span className={`inline-flex items-center border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${STATUS_STYLES[status] || 'border-white/20'}`}>{status}</span>;
}

export default function Account() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const logout = useAuthStore((s) => s.logout);
  const openAuth = useUIStore((s) => s.openAuth);
  const { data, loading, error, reload } = useApi('/api/orders/mine', { enabled: Boolean(user) });

  useEffect(() => {
    if (status === 'ready' && !user) openAuth('login');
  }, [status, user, openAuth]);

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-5 pt-40 text-center">
        <p className="font-display text-3xl font-semibold text-bone">Sign in to view your orders</p>
        <button onClick={() => openAuth('login')} className="btn-gold mt-6" data-testid="button-account-signin">Sign in</button>
      </div>
    );
  }

  const orders = data?.orders || [];

  return (
    <div className="mx-auto max-w-5xl px-5 pt-32 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-8">
        <div>
          <p className="eyebrow">My account</p>
          <h1 className="mt-2 font-display text-4xl font-semibold uppercase text-bone" data-testid="text-account-username">{user.username}</h1>
          <p className="mt-1 text-sm text-white/50">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={reload} className="btn-ghost h-10 px-4" data-testid="button-refresh-orders"><RefreshCw className="h-4 w-4" /> Refresh</button>
          <button onClick={logout} className="btn-ghost h-10 px-4" data-testid="button-logout"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      </header>

      <h2 className="mt-10 font-display text-xl font-semibold uppercase tracking-[0.12em] text-bone">Order history</h2>
      {loading && <div className="mt-6 space-y-3">{[0, 1].map((i) => <div key={i} className="h-32 animate-pulse bg-onyx-800" />)}</div>}
      {error && <p className="mt-6 text-sm text-red-300">{error.message}</p>}
      {!loading && !error && orders.length === 0 && (
        <div className="mt-6 flex flex-col items-center gap-3 border border-white/10 py-14 text-center">
          <Package className="h-8 w-8 text-gold/60" />
          <p className="text-sm text-white/60">No orders yet.</p>
          <Link to="/shop" className="btn-gold mt-2">Start shopping</Link>
        </div>
      )}
      <ul className="mt-6 space-y-4">
        {orders.map((o) => (
          <li key={o.id} className="border border-white/10 bg-onyx-800" data-testid={`card-order-${o.orderNumber}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
              <div>
                <p className="font-mono text-sm text-gold">{o.orderNumber}</p>
                <p className="text-[11px] text-white/40">{formatDate(o.createdAt)}</p>
              </div>
              <StatusBadge status={o.status} />
            </div>
            <div className="grid gap-5 px-5 py-4 md:grid-cols-[1.5fr_1fr]">
              <ul className="space-y-2">
                {o.items.map((i, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm">
                    <img src={resolveImage(i.imageUrl)} alt="" className="h-12 w-9 object-cover" />
                    <span className="flex-1 text-white/80">{i.quantity} × {i.name} <span className="text-white/40">· {i.size}</span></span>
                    <span className={i.isFreebie ? 'text-gold-pale' : 'text-white/70'}>{i.isFreebie ? 'FREE' : formatPeso(i.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-white/55"><span>Subtotal</span><span>{formatPeso(o.subtotal)}</span></div>
                <div className="flex justify-between text-gold"><span>{o.discountTier || 'Discount'}</span><span>−{formatPeso(o.discountApplied)}</span></div>
                <div className="flex justify-between border-t border-white/10 pt-2 font-semibold text-bone"><span>Total</span><span>{formatPeso(o.totalAmount)}</span></div>
                <p className="pt-2 text-[11px] text-white/40">{o.paymentDetails.method} · Ref <span className="font-mono">{o.paymentDetails.referenceNumber}</span></p>
                {o.paymentDetails.rejectionReason && <p className="text-xs text-red-300">Payment issue: {o.paymentDetails.rejectionReason}</p>}
              </div>
            </div>
            {o.statusHistory?.length > 0 && (
              <ol className="flex flex-wrap gap-x-6 gap-y-1 border-t border-white/5 px-5 py-3 text-[11px] text-white/45">
                {o.statusHistory.map((h, idx) => (
                  <li key={idx} className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {h.status} · {formatDate(h.at)}</li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
