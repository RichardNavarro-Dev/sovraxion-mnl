import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Archive,
  BadgeCheck,
  Banknote,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Eye,
  ImagePlus,
  LayoutDashboard,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { api, apiRequest, fetchProtectedImage, resolveImage } from '../lib/api';
import { formatDate, formatPeso } from '../lib/format';
import { useApi, useLockBody } from '../lib/hooks';
import { useUIStore } from '../store/useUIStore';
import { StatusBadge } from '../pages/Account';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'payments', label: 'Verify payments', icon: BadgeCheck },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'products', label: 'Products', icon: Boxes },
  { id: 'customers', label: 'Customers', icon: Users },
];
const STATUSES = ['Pending Payment Verification', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const NEXT_STATUS = {
  'Pending Payment Verification': [],
  Processing: ['Shipped', 'Delivered', 'Cancelled'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};
const CATEGORIES = ['Tees', 'Hoodies', 'Bottoms', 'Accessories', 'Collectibles'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'One Size'];

function ProtectedReceipt({ url, className = '', onOpen }) {
  const [src, setSrc] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => {
    if (!url) return undefined;
    const ctrl = new AbortController();
    let objectUrl = '';
    fetchProtectedImage(url, ctrl.signal)
      .then((u) => {
        objectUrl = u;
        setSrc(u);
      })
      .catch((e) => e.name !== 'AbortError' && setErr('Receipt unavailable'));
    return () => {
      ctrl.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);
  if (err) return <div className={`flex items-center justify-center bg-onyx-700 text-[11px] text-red-300 ${className}`}>{err}</div>;
  if (!src) return <div className={`animate-pulse bg-onyx-700 ${className}`} />;
  return (
    <button type="button" onClick={() => onOpen?.(src)} className={`group relative overflow-hidden bg-onyx-700 ${className}`} aria-label="View receipt full size" data-testid="button-view-receipt">
      <img src={src} alt="Customer payment receipt" className="h-full w-full object-cover" />
      <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100"><Eye className="h-5 w-5 text-gold" /></span>
    </button>
  );
}

function Lightbox({ src, onClose }) {
  return (
    <AnimatePresence>
      {src && (
        <motion.div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} role="dialog" aria-label="Receipt preview">
          <img src={src} alt="Receipt full size" className="max-h-full max-w-full object-contain" />
          <button onClick={onClose} className="absolute right-4 top-4 p-2 text-white/70 hover:text-gold" aria-label="Close"><X className="h-6 w-6" /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Kpi({ label, value, tone = 'text-bone', note }) {
  return (
    <div className="metal-panel p-5">
      <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">{label}</p>
      <p className={`mt-2 font-display text-2xl font-semibold tabular-nums ${tone}`}>{value}</p>
      {note && <p className="mt-1 text-[11px] text-white/40">{note}</p>}
    </div>
  );
}

function Overview({ goTo }) {
  const { data, loading, error, reload } = useApi('/api/admin/stats');
  useEffect(() => {
    const t = setInterval(reload, 30000);
    return () => clearInterval(t);
  }, [reload]);
  if (loading && !data) return <div className="grid gap-3 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse bg-onyx-800" />)}</div>;
  if (error) return <p className="text-sm text-red-300">{error.message}</p>;
  const s = data.stats;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Verified revenue" value={formatPeso(s.verifiedRevenue)} tone="text-gold" note={`${s.verifiedOrders} paid orders`} />
        <Kpi label="Awaiting verification" value={s.byStatus['Pending Payment Verification']} tone="text-amber-200" note="GCash / Maya to 09636688618" />
        <Kpi label="Processing / shipped" value={s.byStatus.Processing + s.byStatus.Shipped} note={`${s.byStatus.Delivered} delivered`} />
        <Kpi label="Customers" value={s.customers} note={`${formatPeso(s.discountsGiven)} discounts given`} />
      </div>
      {s.byStatus['Pending Payment Verification'] > 0 && (
        <button onClick={() => goTo('payments')} className="flex w-full items-center justify-between border border-amber-400/30 bg-amber-400/5 px-5 py-4 text-left text-sm text-amber-100 hover:border-amber-300" data-testid="button-goto-payments">
          <span className="flex items-center gap-3"><AlertTriangle className="h-4 w-4" /> {s.byStatus['Pending Payment Verification']} payment(s) need your verification</span>
          <span className="text-[11px] uppercase tracking-[0.2em]">Review →</span>
        </button>
      )}
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="metal-panel p-5">
          <p className="eyebrow mb-4">Recent orders</p>
          {s.recent.length === 0 ? <p className="text-sm text-white/50">No orders yet.</p> : (
            <ul className="divide-y divide-white/5">
              {s.recent.map((o) => (
                <li key={o._id || o.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <span><span className="font-mono text-gold">{o.orderNumber}</span> <span className="text-white/45">· {o.user?.username}</span></span>
                  <span className="flex items-center gap-3"><span className="tabular-nums text-bone">{formatPeso(o.totalAmount)}</span><StatusBadge status={o.status} /></span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="metal-panel p-5">
          <p className="eyebrow mb-4">Low stock (≤ 5)</p>
          {s.lowStock.length === 0 ? <p className="text-sm text-white/50">All products are well stocked.</p> : (
            <ul className="space-y-3">
              {s.lowStock.map((p) => (
                <li key={p._id || p.id} className="flex items-center gap-3 text-sm">
                  <img src={resolveImage(p.imageUrl)} alt="" className="h-10 w-8 object-cover" />
                  <span className="flex-1 truncate text-white/80">{p.name}</span>
                  <span className={`tabular-nums ${p.stock === 0 ? 'text-red-300' : 'text-amber-200'}`}>{p.stock}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentCard({ order, onDone, onOpenReceipt }) {
  const toast = useUIStore((s) => s.toast);
  const [confirmRef, setConfirmRef] = useState('');
  const [reason, setReason] = useState('');
  const [mode, setMode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const pd = order.paymentDetails;
  const refMatches = confirmRef && confirmRef.replace(/\s/g, '').toUpperCase() === pd.referenceNumber;

  const verify = async () => {
    setBusy(true);
    setErr('');
    try {
      await api.patch(`/api/admin/orders/${order.id}/verify`, { confirmReferenceNumber: confirmRef });
      toast(`${order.orderNumber} verified → Processing.`, 'success');
      onDone();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  const reject = async () => {
    if (reason.trim().length < 5) {
      setErr('Enter a rejection reason (min 5 characters).');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      await api.patch(`/api/admin/orders/${order.id}/reject`, { reason });
      toast(`${order.orderNumber} rejected. Stock restored.`, 'success');
      onDone();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="grid gap-5 border border-white/10 bg-onyx-800 p-5 md:grid-cols-[140px_1fr]" data-testid={`card-payment-${order.orderNumber}`}>
      <ProtectedReceipt url={pd.receiptUrl} className="h-48 w-full md:w-[140px]" onOpen={onOpenReceipt} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-gold">{order.orderNumber}</p>
          <p className="text-[11px] text-white/40">{formatDate(order.createdAt)}</p>
        </div>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div><dt className="text-[10px] uppercase tracking-[0.2em] text-white/40">Method → merchant</dt><dd className="text-bone">{pd.method} → {pd.merchantNumber}</dd></div>
          <div><dt className="text-[10px] uppercase tracking-[0.2em] text-white/40">Amount expected</dt><dd className="font-semibold text-gold">{formatPeso(order.totalAmount)}</dd></div>
          <div><dt className="text-[10px] uppercase tracking-[0.2em] text-white/40">Sender name</dt><dd className="text-bone">{pd.senderName}</dd></div>
          <div><dt className="text-[10px] uppercase tracking-[0.2em] text-white/40">Sender number</dt><dd className="font-mono text-bone">{pd.senderNumber}</dd></div>
          <div className="sm:col-span-2"><dt className="text-[10px] uppercase tracking-[0.2em] text-white/40">Reference number</dt><dd className="font-mono text-lg tracking-wider text-bone" data-testid={`text-ref-${order.orderNumber}`}>{pd.referenceNumber}</dd></div>
          <div className="sm:col-span-2"><dt className="text-[10px] uppercase tracking-[0.2em] text-white/40">Customer</dt><dd className="text-white/70">{order.user?.username} · {order.user?.email} · {order.items.length} line(s)</dd></div>
        </dl>

        {mode === '' && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => setMode('verify')} className="btn-gold h-10 px-4" data-testid={`button-start-verify-${order.orderNumber}`}><CheckCircle2 className="h-4 w-4" /> Verify</button>
            <button onClick={() => setMode('reject')} className="btn-ghost h-10 px-4" data-testid={`button-start-reject-${order.orderNumber}`}><XCircle className="h-4 w-4" /> Reject</button>
          </div>
        )}
        {mode === 'verify' && (
          <div className="mt-4 space-y-2">
            <label className="label" htmlFor={`ref-${order.id}`}>Re-type reference from your {pd.method} history (optional cross-check)</label>
            <div className="flex flex-wrap gap-2">
              <input id={`ref-${order.id}`} value={confirmRef} onChange={(e) => setConfirmRef(e.target.value.replace(/[^A-Za-z0-9\s]/g, ''))} className={`field h-10 flex-1 font-mono uppercase ${confirmRef ? (refMatches ? 'border-emerald-400/60' : 'border-red-500/60') : ''}`} placeholder={pd.referenceNumber} data-testid={`input-confirm-ref-${order.orderNumber}`} />
              <button onClick={verify} disabled={busy || (confirmRef && !refMatches)} className="btn-gold h-10 px-4" data-testid={`button-confirm-verify-${order.orderNumber}`}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Approve</button>
              <button onClick={() => setMode('')} className="btn-ghost h-10 px-4">Cancel</button>
            </div>
            {confirmRef && <p className={`text-xs ${refMatches ? 'text-emerald-300' : 'text-red-300'}`}>{refMatches ? 'Reference matches the customer submission.' : 'Reference does not match.'}</p>}
          </div>
        )}
        {mode === 'reject' && (
          <div className="mt-4 space-y-2">
            <label className="label" htmlFor={`reason-${order.id}`}>Rejection reason (shown to customer)</label>
            <div className="flex flex-wrap gap-2">
              <input id={`reason-${order.id}`} value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} className="field h-10 flex-1" placeholder="e.g. Reference not found in GCash history" data-testid={`input-reject-reason-${order.orderNumber}`} />
              <button onClick={reject} disabled={busy} className="inline-flex h-10 items-center gap-2 bg-red-500/90 px-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-white hover:bg-red-500 disabled:opacity-50" data-testid={`button-confirm-reject-${order.orderNumber}`}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Reject & restock</button>
              <button onClick={() => setMode('')} className="btn-ghost h-10 px-4">Cancel</button>
            </div>
          </div>
        )}
        {err && <p className="mt-2 text-xs text-red-300" role="alert">{err}</p>}
      </div>
    </li>
  );
}

function Payments({ onOpenReceipt }) {
  const { data, loading, error, reload } = useApi('/api/admin/orders?status=Pending%20Payment%20Verification');
  useEffect(() => {
    const t = setInterval(reload, 20000);
    return () => clearInterval(t);
  }, [reload]);
  const orders = data?.orders || [];
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-white/55">{loading ? 'Loading…' : `${orders.length} pending`} · auto-refreshes every 20s</p>
        <button onClick={reload} className="btn-ghost h-9 px-3 text-[11px]" data-testid="button-refresh-payments"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
      </div>
      {error && <p className="text-sm text-red-300">{error.message}</p>}
      {!loading && orders.length === 0 && (
        <div className="flex flex-col items-center gap-3 border border-white/10 py-16 text-center">
          <BadgeCheck className="h-8 w-8 text-gold/70" />
          <p className="text-sm text-white/60">All caught up — no payments waiting for verification.</p>
        </div>
      )}
      <ul className="space-y-4">
        {orders.map((o) => <PaymentCard key={o.id} order={o} onDone={reload} onOpenReceipt={onOpenReceipt} />)}
      </ul>
    </div>
  );
}

function OrderDetail({ orderId, onClose, onChanged, onOpenReceipt }) {
  const toast = useUIStore((s) => s.toast);
  const { data, loading, error, reload } = useApi(orderId ? `/api/admin/orders/${orderId}` : null, { enabled: Boolean(orderId) });
  const [next, setNext] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  useLockBody(Boolean(orderId));
  const order = data?.order;
  useEffect(() => {
    setNext('');
    setNote('');
  }, [orderId]);

  const update = async () => {
    if (!next) return;
    setBusy(true);
    try {
      await api.patch(`/api/admin/orders/${orderId}/status`, { status: next, note });
      toast(`Status updated to ${next}.`, 'success');
      setNext('');
      setNote('');
      await reload();
      onChanged();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {orderId && (
        <>
          <motion.div className="fixed inset-0 z-[95] bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside className="scrollbar-thin fixed inset-y-0 right-0 z-[96] w-full max-w-xl overflow-y-auto border-l border-gold/20 bg-onyx-900" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.35 }} role="dialog" aria-label="Order detail" data-testid="drawer-order-detail">
            <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-white/10 bg-onyx-900 px-5">
              <p className="font-mono text-gold">{order?.orderNumber || 'Order'}</p>
              <button onClick={onClose} className="p-2 text-white/60 hover:text-gold" aria-label="Close"><X className="h-5 w-5" /></button>
            </header>
            {loading && !order && <div className="p-6"><Loader2 className="h-5 w-5 animate-spin text-gold" /></div>}
            {error && <p className="p-6 text-sm text-red-300">{error.message}</p>}
            {order && (
              <div className="space-y-6 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2"><StatusBadge status={order.status} /><span className="text-[11px] text-white/40">{formatDate(order.createdAt)}</span></div>
                <section className="grid gap-4 sm:grid-cols-[120px_1fr]">
                  <ProtectedReceipt url={order.paymentDetails.receiptUrl} className="h-40 w-full sm:w-[120px]" onOpen={onOpenReceipt} />
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-3"><dt className="text-white/45">Method</dt><dd>{order.paymentDetails.method} → {order.paymentDetails.merchantNumber}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-white/45">Sender</dt><dd>{order.paymentDetails.senderName}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-white/45">Sender no.</dt><dd className="font-mono">{order.paymentDetails.senderNumber}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-white/45">Reference</dt><dd className="font-mono">{order.paymentDetails.referenceNumber}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-white/45">Verified</dt><dd className={order.paymentDetails.verified ? 'text-emerald-300' : 'text-amber-200'}>{order.paymentDetails.verified ? `Yes · ${formatDate(order.paymentDetails.verifiedAt)}` : 'No'}</dd></div>
                    {data.insights?.otherOrdersFromSender > 0 && <div className="text-[11px] text-white/45">{data.insights.otherOrdersFromSender} other order(s) from this sender number</div>}
                  </dl>
                </section>
                <section>
                  <p className="eyebrow mb-3">Items</p>
                  <ul className="space-y-2">
                    {order.items.map((i, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-sm">
                        <img src={resolveImage(i.imageUrl)} alt="" className="h-12 w-9 object-cover" />
                        <span className="flex-1">{i.quantity} × {i.name} <span className="text-white/40">· {i.size}</span></span>
                        <span className={i.isFreebie ? 'text-gold-pale' : ''}>{i.isFreebie ? 'FREE' : formatPeso(i.lineTotal)}</span>
                      </li>
                    ))}
                  </ul>
                  <dl className="mt-4 space-y-1 border-t border-white/10 pt-3 text-sm">
                    <div className="flex justify-between text-white/60"><dt>Subtotal</dt><dd>{formatPeso(order.subtotal)}</dd></div>
                    <div className="flex justify-between text-gold"><dt>{order.discountTier || 'No tier'}</dt><dd>−{formatPeso(order.discountApplied)}</dd></div>
                    <div className="flex justify-between font-semibold"><dt>Total</dt><dd>{formatPeso(order.totalAmount)}</dd></div>
                  </dl>
                </section>
                <section className="text-sm">
                  <p className="eyebrow mb-2">Ship to</p>
                  <p>{order.shipping.fullName} · <span className="font-mono">{order.shipping.phone}</span></p>
                  <p className="text-white/60">{order.shipping.addressLine}, {order.shipping.city}, {order.shipping.province} {order.shipping.postalCode}</p>
                  {order.shipping.notes && <p className="mt-1 text-white/45">Note: {order.shipping.notes}</p>}
                </section>
                {NEXT_STATUS[order.status]?.length > 0 && (
                  <section className="border border-white/10 p-4">
                    <p className="eyebrow mb-3">Update status</p>
                    <div className="flex flex-wrap gap-2">
                      {NEXT_STATUS[order.status].map((s) => (
                        <button key={s} onClick={() => setNext(s)} className={`chip ${next === s ? 'border-gold bg-gold text-onyx' : 'hover:border-white/30'}`} data-testid={`button-next-status-${s.toLowerCase()}`}>{s}</button>
                      ))}
                    </div>
                    <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Note (e.g. tracking number)" className="field mt-3 h-10" data-testid="input-status-note" />
                    <button onClick={update} disabled={!next || busy} className="btn-gold mt-3 h-10 w-full" data-testid="button-apply-status">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Apply {next || 'status'}</button>
                    {next === 'Cancelled' && <p className="mt-2 text-[11px] text-amber-200">Cancelling automatically restores stock for all items.</p>}
                  </section>
                )}
                {order.status === 'Pending Payment Verification' && <p className="text-[11px] text-amber-200">Use the “Verify payments” tab to approve or reject this payment.</p>}
                <section>
                  <p className="eyebrow mb-3">History</p>
                  <ol className="space-y-2 border-l border-gold/30 pl-4 text-sm">
                    {order.statusHistory.map((h, idx) => (
                      <li key={idx}><span className="text-bone">{h.status}</span> <span className="text-[11px] text-white/40">· {formatDate(h.at)}</span>{h.note && <p className="text-xs text-white/50">{h.note}</p>}</li>
                    ))}
                  </ol>
                </section>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Orders({ onOpenReceipt }) {
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);
  const qs = useMemo(() => {
    const q = new URLSearchParams();
    if (status) q.set('status', status);
    if (method) q.set('method', method);
    if (debounced) q.set('search', debounced);
    return q.toString();
  }, [status, method, debounced]);
  const { data, loading, error, reload } = useApi(`/api/admin/orders?${qs}`);
  const orders = data?.orders || [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <label className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order #, reference, sender…" className="field h-10 pl-9" data-testid="input-order-search" />
        </label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="field h-10 w-auto" data-testid="select-order-status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={method} onChange={(e) => setMethod(e.target.value)} className="field h-10 w-auto" data-testid="select-order-method">
          <option value="">GCash & Maya</option>
          <option value="GCash">GCash</option>
          <option value="Maya">Maya</option>
        </select>
        <button onClick={reload} className="btn-ghost h-10 px-3"><RefreshCw className="h-4 w-4" /></button>
      </div>
      {error && <p className="text-sm text-red-300">{error.message}</p>}
      <div className="scrollbar-thin overflow-x-auto border border-white/10">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-onyx-800 text-[10px] uppercase tracking-[0.2em] text-white/45">
            <tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" /></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && !orders.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-white/40">Loading…</td></tr>}
            {!loading && orders.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-white/40">No orders match.</td></tr>}
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-white/[0.02]" data-testid={`row-order-${o.orderNumber}`}>
                <td className="px-4 py-3"><p className="font-mono text-gold">{o.orderNumber}</p><p className="text-[11px] text-white/40">{formatDate(o.createdAt)}</p></td>
                <td className="px-4 py-3"><p>{o.shipping.fullName}</p><p className="text-[11px] text-white/40">{o.user?.email}</p></td>
                <td className="px-4 py-3"><p>{o.paymentDetails.method}</p><p className="font-mono text-[11px] text-white/40">{o.paymentDetails.referenceNumber}</p></td>
                <td className="px-4 py-3 text-right tabular-nums">{formatPeso(o.totalAmount)}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3 text-right"><button onClick={() => setSelected(o.id)} className="text-[11px] uppercase tracking-[0.18em] text-gold hover:underline" data-testid={`button-open-order-${o.orderNumber}`}>Manage</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <OrderDetail orderId={selected} onClose={() => setSelected(null)} onChanged={reload} onOpenReceipt={onOpenReceipt} />
    </div>
  );
}

const emptyProduct = { name: '', description: '', price: '', compareAtPrice: '', category: 'Tees', collectionName: 'Core', sizes: ['XS', 'S', 'M', 'L', 'XL'], stock: '', imageUrl: '', isFeatured: false, isActive: true };

function ProductForm({ initial, onClose, onSaved }) {
  const toast = useUIStore((s) => s.toast);
  const [form, setForm] = useState(initial ? { ...emptyProduct, ...initial, compareAtPrice: initial.compareAtPrice ?? '' } : emptyProduct);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  useLockBody(true);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Name is required.';
    if (form.description.trim().length < 10) e.description = 'Min 10 characters.';
    if (!(Number(form.price) >= 1)) e.price = 'Enter a valid price.';
    if (form.compareAtPrice !== '' && Number(form.compareAtPrice) !== 0 && Number(form.compareAtPrice) <= Number(form.price)) e.compareAtPrice = 'Must be higher than price.';
    if (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0 || form.stock === '') e.stock = 'Whole number ≥ 0.';
    if (!form.sizes.length) e.sizes = 'Pick at least one size.';
    if (!form.imageUrl) e.imageUrl = 'Upload an image or paste an https URL.';
    return e;
  };

  const upload = async (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setErrors((e) => ({ ...e, imageUrl: 'JPG/PNG/WEBP up to 5 MB.' }));
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await apiRequest('POST', '/api/products/upload-image', fd);
      set('imageUrl', res.imageUrl);
      setErrors((e) => ({ ...e, imageUrl: undefined }));
    } catch (err) {
      setErrors((e) => ({ ...e, imageUrl: err.message }));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    const body = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice === '' ? null : Number(form.compareAtPrice),
      category: form.category,
      collectionName: form.collectionName.trim() || 'Core',
      sizes: form.sizes,
      stock: Number(form.stock),
      imageUrl: form.imageUrl.trim(),
      isFeatured: form.isFeatured,
      isActive: form.isActive,
    };
    try {
      if (initial?.id) await api.put(`/api/products/${initial.id}`, body);
      else await api.post('/api/products', body);
      toast(initial?.id ? 'Product updated.' : 'Product created.', 'success');
      onSaved();
    } catch (err) {
      if (err.details) setErrors(err.details);
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const F = ({ k, label, children }) => (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {errors[k] && <span className="mt-1 block text-xs text-red-300">{errors[k]}</span>}
    </label>
  );

  return (
    <motion.div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-label="Product editor" data-testid="modal-product-form">
      <div className="scrollbar-thin max-h-[94dvh] w-full max-w-3xl overflow-y-auto border border-gold/25 bg-onyx-900">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-white/10 bg-onyx-900 px-5">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.2em]">{initial?.id ? 'Edit product' : 'New product'}</p>
          <button onClick={onClose} className="p-2 text-white/60 hover:text-gold" aria-label="Close"><X className="h-5 w-5" /></button>
        </header>
        <div className="grid gap-5 p-5 md:grid-cols-[200px_1fr]">
          <div>
            <div className="aspect-[3/4] overflow-hidden border border-white/10 bg-onyx-800">
              {form.imageUrl ? <img src={resolveImage(form.imageUrl)} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-white/30"><ImagePlus className="h-8 w-8" /></div>}
            </div>
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-ghost mt-2 h-10 w-full px-3 text-[11px]" data-testid="button-upload-product-image">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Upload image</button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
            <input value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="or https:// image URL" className="field mt-2 h-10 text-xs" data-testid="input-product-image-url" />
            {errors.imageUrl && <span className="mt-1 block text-xs text-red-300">{errors.imageUrl}</span>}
          </div>
          <div className="space-y-4">
            {F({ k: 'name', label: 'Name', children: <input value={form.name} maxLength={120} onChange={(e) => set('name', e.target.value)} className="field" data-testid="input-product-name" /> })}
            {F({ k: 'description', label: 'Description', children: <textarea value={form.description} maxLength={4000} onChange={(e) => set('description', e.target.value)} className="field h-28 resize-y py-3" data-testid="input-product-description" /> })}
            <div className="grid gap-4 sm:grid-cols-3">
              {F({ k: 'price', label: 'Price (₱)', children: <input type="number" min="1" step="1" value={form.price} onChange={(e) => set('price', e.target.value)} className="field" data-testid="input-product-price" /> })}
              {F({ k: 'compareAtPrice', label: 'Compare-at (₱)', children: <input type="number" min="0" step="1" value={form.compareAtPrice} onChange={(e) => set('compareAtPrice', e.target.value)} className="field" placeholder="Sale only" data-testid="input-product-compare" /> })}
              {F({ k: 'stock', label: 'Stock', children: <input type="number" min="0" step="1" value={form.stock} onChange={(e) => set('stock', e.target.value)} className="field" data-testid="input-product-stock" /> })}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {F({ k: 'category', label: 'Category', children: (
                <select value={form.category} onChange={(e) => set('category', e.target.value)} className="field" data-testid="select-product-category">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              ) })}
              {F({ k: 'collectionName', label: 'Collection', children: <input value={form.collectionName} maxLength={60} onChange={(e) => set('collectionName', e.target.value)} className="field" data-testid="input-product-collection" /> })}
            </div>
            <div>
              <span className="label">Sizes</span>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((s) => {
                  const on = form.sizes.includes(s);
                  return <button key={s} type="button" onClick={() => set('sizes', on ? form.sizes.filter((x) => x !== s) : [...form.sizes, s])} className={`chip ${on ? 'border-gold bg-gold text-onyx' : 'hover:border-white/30'}`} data-testid={`toggle-size-${s.replace(/\s+/g, '-').toLowerCase()}`}>{s}</button>;
                })}
              </div>
              {errors.sizes && <span className="mt-1 block text-xs text-red-300">{errors.sizes}</span>}
            </div>
            <div className="flex flex-wrap gap-5 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="accent-[#d4af37]" /> Featured (New drops)</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="accent-[#d4af37]" /> Visible in store</label>
            </div>
            <button onClick={save} disabled={saving || uploading} className="btn-gold w-full" data-testid="button-save-product">{saving && <Loader2 className="h-4 w-4 animate-spin" />} {initial?.id ? 'Save changes' : 'Create product'}</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Products() {
  const toast = useUIStore((s) => s.toast);
  const { data, loading, error, reload } = useApi('/api/admin/products');
  const [editing, setEditing] = useState(null);
  const [stockEdits, setStockEdits] = useState({});
  const products = data?.products || [];

  const saveStock = async (p) => {
    const v = Number(stockEdits[p.id]);
    if (!Number.isInteger(v) || v < 0) {
      toast('Stock must be a whole number ≥ 0.', 'error');
      return;
    }
    try {
      await api.put(`/api/products/${p.id}`, { stock: v });
      toast(`${p.name}: stock set to ${v}.`, 'success');
      setStockEdits((s) => {
        const n = { ...s };
        delete n[p.id];
        return n;
      });
      reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const [confirmId, setConfirmId] = useState(null);

  const archive = async (p) => {
    if (confirmId !== p.id) {
      setConfirmId(p.id);
      setTimeout(() => setConfirmId((c) => (c === p.id ? null : c)), 4000);
      return;
    }
    setConfirmId(null);
    try {
      await api.del(`/api/products/${p.id}`);
      toast('Product archived.', 'success');
      reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-white/55">{products.length} products · stock auto-deducts on every order</p>
        <button onClick={() => setEditing({})} className="btn-gold h-10 px-4" data-testid="button-new-product"><Plus className="h-4 w-4" /> Add product</button>
      </div>
      {error && <p className="text-sm text-red-300">{error.message}</p>}
      <div className="scrollbar-thin overflow-x-auto border border-white/10">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-onyx-800 text-[10px] uppercase tracking-[0.2em] text-white/45">
            <tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Category</th><th className="px-4 py-3 text-right">Price</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3 text-right">Sold</th><th className="px-4 py-3">State</th><th className="px-4 py-3" /></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && !products.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-white/40">Loading…</td></tr>}
            {products.map((p) => (
              <tr key={p.id} className={p.isActive ? '' : 'opacity-50'} data-testid={`row-product-${p.slug}`}>
                <td className="px-4 py-3"><div className="flex items-center gap-3"><img src={resolveImage(p.imageUrl)} alt="" className="h-12 w-9 object-cover" /><div><p className="text-bone">{p.name}</p><p className="text-[11px] text-white/40">{p.collectionName}{p.isFreebie ? ' · Freebie' : ''}</p></div></div></td>
                <td className="px-4 py-3 text-white/70">{p.category}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatPeso(p.price)}{p.compareAtPrice && <p className="text-[11px] text-white/35 line-through">{formatPeso(p.compareAtPrice)}</p>}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <input type="number" min="0" value={stockEdits[p.id] ?? p.stock} onChange={(e) => setStockEdits({ ...stockEdits, [p.id]: e.target.value })} className={`field h-9 w-20 px-2 tabular-nums ${p.stock <= 5 ? 'text-amber-200' : ''}`} aria-label={`Stock for ${p.name}`} data-testid={`input-stock-${p.slug}`} />
                    {stockEdits[p.id] !== undefined && String(stockEdits[p.id]) !== String(p.stock) && <button onClick={() => saveStock(p)} className="text-[11px] uppercase text-gold hover:underline" data-testid={`button-save-stock-${p.slug}`}>Save</button>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-white/60">{p.soldCount}</td>
                <td className="px-4 py-3 text-[11px] uppercase tracking-[0.14em]">{p.isActive ? <span className="text-emerald-300">Live</span> : <span className="text-white/40">Archived</span>}{p.isFeatured && <span className="ml-2 text-gold">★</span>}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditing(p)} className="p-2 text-white/60 hover:text-gold" aria-label={`Edit ${p.name}`} data-testid={`button-edit-${p.slug}`}><Pencil className="h-4 w-4" /></button>
                    {p.isActive && !p.isFreebie && <button onClick={() => archive(p)} className={`flex items-center gap-1 p-2 text-[11px] uppercase ${confirmId === p.id ? 'text-red-300' : 'text-white/60 hover:text-red-300'}`} aria-label={`Archive ${p.name}`} data-testid={`button-archive-${p.slug}`}><Archive className="h-4 w-4" />{confirmId === p.id && 'Confirm'}</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AnimatePresence>
        {editing && <ProductForm initial={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      </AnimatePresence>
    </div>
  );
}

function Customers() {
  const { data, loading, error } = useApi('/api/admin/customers');
  const customers = data?.customers || [];
  return (
    <div>
      {error && <p className="text-sm text-red-300">{error.message}</p>}
      <div className="scrollbar-thin overflow-x-auto border border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-onyx-800 text-[10px] uppercase tracking-[0.2em] text-white/45">
            <tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Last login</th><th className="px-4 py-3 text-right">Orders</th><th className="px-4 py-3 text-right">Verified spend</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && <tr><td colSpan={5} className="px-4 py-8 text-center text-white/40">Loading…</td></tr>}
            {!loading && customers.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-white/40">No customers yet.</td></tr>}
            {customers.map((c) => (
              <tr key={c._id}>
                <td className="px-4 py-3"><p className="text-bone">{c.username}</p><p className="text-[11px] text-white/40">{c.email}</p></td>
                <td className="px-4 py-3 text-white/60">{formatDate(c.createdAt)}</td>
                <td className="px-4 py-3 text-white/60">{c.lastLoginAt ? formatDate(c.lastLoginAt) : '—'}</td>
                <td className="px-4 py-3 text-right tabular-nums">{c.orderCount}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gold">{formatPeso(c.totalSpent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [lightbox, setLightbox] = useState('');
  const openReceipt = useCallback((src) => setLightbox(src), []);

  return (
    <div className="mx-auto max-w-[1440px] px-5 pt-32 sm:px-8" data-testid="view-admin">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="eyebrow flex items-center gap-2"><ShieldAlert className="h-3.5 w-3.5" /> Owner-only · Restricted</p>
          <h1 className="mt-2 font-display text-3xl font-semibold uppercase tracking-wide text-bone">Command centre</h1>
          <p className="mt-1 text-sm text-white/50">GCash & Maya receipts to <span className="font-mono text-gold">09636688618</span> · SOVRAXION MNL</p>
        </div>
        <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/40"><Banknote className="h-4 w-4 text-gold" /> PHP</span>
      </header>
      <nav className="scrollbar-thin -mx-5 flex gap-1 overflow-x-auto border-b border-white/10 px-5 sm:mx-0 sm:px-0" aria-label="Admin sections">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`flex flex-none items-center gap-2 border-b-2 px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${tab === id ? 'border-gold text-gold' : 'border-transparent text-white/50 hover:text-bone'}`} data-testid={`tab-admin-${id}`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </nav>
      <div className="py-6">
        {tab === 'overview' && <Overview goTo={setTab} />}
        {tab === 'payments' && <Payments onOpenReceipt={openReceipt} />}
        {tab === 'orders' && <Orders onOpenReceipt={openReceipt} />}
        {tab === 'products' && <Products />}
        {tab === 'customers' && <Customers />}
      </div>
      <Lightbox src={lightbox} onClose={() => setLightbox('')} />
    </div>
  );
}
