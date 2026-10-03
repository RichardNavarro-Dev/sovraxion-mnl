import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, Copy, ImagePlus, Loader2, Lock, Smartphone, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ApiError, api, apiRequest, resolveImage } from '../lib/api';
import { PH_MOBILE_RE, REFERENCE_RE, formatPeso, normalizeMobile } from '../lib/format';
import { useLockBody } from '../lib/hooks';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore, useCartTotals } from '../store/useCartStore';
import { useUIStore } from '../store/useUIStore';
import { OrderSummary } from './CartDrawer';

const MERCHANT_FALLBACK = { accountName: 'SOVRAXION MNL', accountNumber: '09636688618', methods: ['GCash', 'Maya'] };
const MAX_FILE = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

const METHOD_STYLE = {
  GCash: { ring: 'ring-[#007dfe]', badge: 'bg-[#007dfe]', label: 'GCash', hint: 'Send Money → Express Send' },
  Maya: { ring: 'ring-[#00b14f]', badge: 'bg-[#00b14f]', label: 'Maya', hint: 'Send Money → Mobile Number' },
};

const emptyShipping = { fullName: '', phone: '', addressLine: '', city: '', province: '', postalCode: '', notes: '' };
const emptyPayment = { method: 'GCash', senderName: '', senderNumber: '', referenceNumber: '' };

function Field({ label, error, children, hint }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-red-300" role="alert">{error}</span> : hint ? <span className="mt-1 block text-[11px] text-white/35">{hint}</span> : null}
    </label>
  );
}

function validateShipping(s) {
  const e = {};
  if (s.fullName.trim().length < 2) e.fullName = 'Enter the recipient’s full name.';
  if (!PH_MOBILE_RE.test(normalizeMobile(s.phone))) e.phone = 'Use a PH mobile number, e.g. 09171234567.';
  if (s.addressLine.trim().length < 5) e.addressLine = 'House no., street, barangay are required.';
  if (s.city.trim().length < 2) e.city = 'City / municipality is required.';
  if (s.province.trim().length < 2) e.province = 'Province / region is required.';
  if (!/^\d{4}$/.test(s.postalCode.trim())) e.postalCode = '4-digit postal code.';
  return e;
}

function validatePayment(p, file) {
  const e = {};
  if (!['GCash', 'Maya'].includes(p.method)) e.method = 'Choose GCash or Maya.';
  if (p.senderName.trim().length < 2 || !/^[\p{L} .'-]+$/u.test(p.senderName.trim())) e.senderName = 'Enter the account name shown in your e-wallet.';
  if (!PH_MOBILE_RE.test(normalizeMobile(p.senderNumber))) e.senderNumber = 'Use the 11-digit mobile number you paid from.';
  if (!REFERENCE_RE.test(p.referenceNumber.replace(/\s/g, ''))) e.referenceNumber = '8–20 letters/digits from your receipt.';
  if (!file) e.receipt = 'Attach a screenshot of your payment receipt.';
  return e;
}

export default function CheckoutModal() {
  const open = useUIStore((s) => s.checkoutOpen);
  const setCheckout = useUIStore((s) => s.setCheckout);
  const toast = useUIStore((s) => s.toast);
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const syncWithCatalog = useCartStore((s) => s.syncWithCatalog);
  const expireSession = useAuthStore((s) => s.expireSession);
  const totals = useCartTotals();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [shipping, setShipping] = useState(emptyShipping);
  const [payment, setPayment] = useState(emptyPayment);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [placed, setPlaced] = useState(null);
  const [merchant, setMerchant] = useState(MERCHANT_FALLBACK);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef(null);

  useLockBody(open);

  useEffect(() => {
    if (!open) return;
    api
      .get('/api/config/store')
      .then((d) => d?.merchant && setMerchant(d.merchant))
      .catch(() => setMerchant(MERCHANT_FALLBACK));
  }, [open]);

  useEffect(() => {
    if (!file) {
      setPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const close = () => {
    if (submitting) return;
    setCheckout(false);
    setTimeout(() => {
      if (placed) {
        setPlaced(null);
        setStep(1);
        setPayment(emptyPayment);
        setFile(null);
      }
      setServerError('');
      setErrors({});
    }, 300);
  };

  const pickFile = (f) => {
    if (!f) return;
    if (!ALLOWED.includes(f.type)) {
      setErrors((e) => ({ ...e, receipt: 'Only JPG, PNG or WEBP screenshots are accepted.' }));
      return;
    }
    if (f.size > MAX_FILE) {
      setErrors((e) => ({ ...e, receipt: 'Screenshot must be 5 MB or smaller.' }));
      return;
    }
    setErrors((e) => ({ ...e, receipt: undefined }));
    setFile(f);
  };

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(merchant.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast(`Number: ${merchant.accountNumber}`);
    }
  };

  const goPayment = () => {
    const e = validateShipping(shipping);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep(2);
  };

  const goReview = () => {
    const e = validatePayment(payment, file);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep(3);
  };

  const submit = async () => {
    const e = { ...validateShipping(shipping), ...validatePayment(payment, file) };
    setErrors(e);
    if (Object.keys(e).length) {
      setStep(Object.keys(validateShipping(shipping)).length ? 1 : 2);
      return;
    }
    setSubmitting(true);
    setServerError('');
    const payload = {
      items: items.map((i) => ({ productId: i.productId, size: i.size, quantity: i.quantity })),
      shipping: {
        ...shipping,
        phone: normalizeMobile(shipping.phone),
        postalCode: shipping.postalCode.trim(),
      },
      payment: {
        method: payment.method,
        senderName: payment.senderName.trim(),
        senderNumber: normalizeMobile(payment.senderNumber),
        referenceNumber: payment.referenceNumber.replace(/\s/g, '').toUpperCase(),
      },
      expectedTotal: totals.total,
    };
    const form = new FormData();
    form.append('order', JSON.stringify(payload));
    form.append('receipt', file);
    try {
      const data = await apiRequest('POST', '/api/orders', form);
      setPlaced(data.order);
      clear();
      toast(`Order ${data.order.orderNumber} placed.`, 'success');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        expireSession();
        setServerError('Your session expired. Please sign in again to place your order.');
      } else if (err instanceof ApiError && err.status === 409) {
        setServerError(err.message);
        try {
          const fresh = await api.get('/api/products');
          syncWithCatalog(fresh.products);
        } catch {
          /* catalog refresh is best-effort */
        }
      } else {
        setServerError(err.message || 'Unable to place order.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const methodStyle = METHOD_STYLE[payment.method];
  const stepLabels = useMemo(() => ['Shipping', 'Payment', 'Review'], []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && close()}
          role="dialog"
          aria-modal="true"
          aria-label="Checkout"
          data-testid="modal-checkout"
        >
          <motion.div
            className="relative flex max-h-[96dvh] w-full max-w-5xl flex-col overflow-hidden border border-gold/25 bg-onyx-900 shadow-gold"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="flex h-16 flex-none items-center justify-between border-b border-white/10 px-5 sm:px-7">
              <div className="flex items-center gap-3">
                {step > 1 && !placed && (
                  <button onClick={() => setStep(step - 1)} className="p-1.5 text-white/60 hover:text-gold" aria-label="Back" data-testid="button-checkout-back">
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}
                <p className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.24em] text-bone">
                  <Lock className="h-4 w-4 text-gold" /> Secure checkout
                </p>
              </div>
              {!placed && (
                <ol className="hidden items-center gap-4 md:flex">
                  {stepLabels.map((l, i) => (
                    <li key={l} className={`flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] ${step === i + 1 ? 'text-gold' : step > i + 1 ? 'text-bone' : 'text-white/35'}`}>
                      <span className={`flex h-5 w-5 items-center justify-center border text-[10px] ${step > i + 1 ? 'border-gold bg-gold text-onyx' : step === i + 1 ? 'border-gold' : 'border-white/20'}`}>
                        {step > i + 1 ? <Check className="h-3 w-3" /> : i + 1}
                      </span>
                      {l}
                    </li>
                  ))}
                </ol>
              )}
              <button onClick={close} className="p-2 text-white/60 hover:text-gold" aria-label="Close checkout" data-testid="button-close-checkout">
                <X className="h-5 w-5" />
              </button>
            </header>

            {placed ? (
              <div className="scrollbar-thin overflow-y-auto px-6 py-12 text-center sm:px-12" data-testid="view-order-success">
                <CheckCircle2 className="mx-auto h-14 w-14 text-gold" aria-hidden="true" />
                <p className="eyebrow mt-6">Order received</p>
                <h2 className="mt-3 font-display text-3xl font-semibold text-bone">Salamat, {placed.shipping.fullName.split(' ')[0]}.</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/60">
                  Order <span className="font-mono text-gold" data-testid="text-order-number">{placed.orderNumber}</span> is now{' '}
                  <span className="text-bone">Pending Payment Verification</span>. The owner will match your {placed.paymentDetails.method} reference{' '}
                  <span className="font-mono text-bone">{placed.paymentDetails.referenceNumber}</span> against {placed.paymentDetails.merchantNumber} and move it to Processing.
                </p>
                <div className="mx-auto mt-8 max-w-sm border border-white/10 bg-onyx-800 p-5 text-left">
                  <div className="flex justify-between text-sm text-white/60"><span>Subtotal</span><span>{formatPeso(placed.subtotal)}</span></div>
                  <div className="mt-1 flex justify-between text-sm text-gold"><span>Discount</span><span>−{formatPeso(placed.discountApplied)}</span></div>
                  {placed.freebies?.length > 0 && <div className="mt-1 flex justify-between text-sm text-gold-pale"><span>Freebie</span><span>{placed.freebies.join(', ')}</span></div>}
                  <div className="mt-3 flex justify-between border-t border-white/10 pt-3 font-display text-lg text-bone"><span>Paid</span><span className="text-gold">{formatPeso(placed.totalAmount)}</span></div>
                </div>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => {
                      close();
                      navigate('/account');
                    }}
                    className="btn-gold"
                    data-testid="button-view-orders"
                  >
                    Track my order
                  </button>
                  <button onClick={close} className="btn-ghost" data-testid="button-continue-shopping">Keep shopping</button>
                </div>
              </div>
            ) : (
              <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[1.35fr_1fr]">
                <div className="scrollbar-thin min-h-0 overflow-y-auto px-5 py-6 sm:px-7">
                  {step === 1 && (
                    <section aria-labelledby="ship-title" className="space-y-4">
                      <h3 id="ship-title" className="font-display text-lg font-semibold uppercase tracking-[0.14em] text-bone">Shipping details</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Full name" error={errors.fullName}>
                          <input className={`field ${errors.fullName ? 'field-error' : ''}`} value={shipping.fullName} maxLength={80} autoComplete="name" onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })} data-testid="input-ship-name" />
                        </Field>
                        <Field label="Mobile number" error={errors.phone}>
                          <input className={`field ${errors.phone ? 'field-error' : ''}`} value={shipping.phone} maxLength={16} inputMode="tel" autoComplete="tel" placeholder="09XXXXXXXXX" onChange={(e) => setShipping({ ...shipping, phone: e.target.value.replace(/[^\d+\s-]/g, '') })} data-testid="input-ship-phone" />
                        </Field>
                      </div>
                      <Field label="Street address, barangay" error={errors.addressLine}>
                        <input className={`field ${errors.addressLine ? 'field-error' : ''}`} value={shipping.addressLine} maxLength={200} autoComplete="street-address" onChange={(e) => setShipping({ ...shipping, addressLine: e.target.value })} data-testid="input-ship-address" />
                      </Field>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <Field label="City" error={errors.city}>
                          <input className={`field ${errors.city ? 'field-error' : ''}`} value={shipping.city} maxLength={80} autoComplete="address-level2" onChange={(e) => setShipping({ ...shipping, city: e.target.value })} data-testid="input-ship-city" />
                        </Field>
                        <Field label="Province" error={errors.province}>
                          <input className={`field ${errors.province ? 'field-error' : ''}`} value={shipping.province} maxLength={80} autoComplete="address-level1" onChange={(e) => setShipping({ ...shipping, province: e.target.value })} data-testid="input-ship-province" />
                        </Field>
                        <Field label="Postal code" error={errors.postalCode}>
                          <input className={`field ${errors.postalCode ? 'field-error' : ''}`} value={shipping.postalCode} maxLength={4} inputMode="numeric" autoComplete="postal-code" onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value.replace(/\D/g, '') })} data-testid="input-ship-postal" />
                        </Field>
                      </div>
                      <Field label="Delivery notes (optional)">
                        <textarea className="field h-20 resize-none py-3" value={shipping.notes} maxLength={300} onChange={(e) => setShipping({ ...shipping, notes: e.target.value })} data-testid="input-ship-notes" />
                      </Field>
                      <button onClick={goPayment} className="btn-gold w-full" data-testid="button-to-payment">Continue to payment</button>
                    </section>
                  )}

                  {step === 2 && (
                    <section aria-labelledby="pay-title" className="space-y-5">
                      <h3 id="pay-title" className="font-display text-lg font-semibold uppercase tracking-[0.14em] text-bone">Pay with e-wallet</h3>
                      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Payment method">
                        {merchant.methods.map((m) => (
                          <button
                            key={m}
                            role="radio"
                            aria-checked={payment.method === m}
                            onClick={() => setPayment({ ...payment, method: m })}
                            className={`flex items-center gap-3 border border-white/10 bg-onyx-800 p-4 text-left transition ${payment.method === m ? `ring-2 ${METHOD_STYLE[m].ring}` : 'hover:border-white/30'}`}
                            data-testid={`button-method-${m.toLowerCase()}`}
                          >
                            <span className={`flex h-10 w-10 items-center justify-center rounded-full ${METHOD_STYLE[m].badge} font-display text-sm font-bold text-white`}>{m[0]}</span>
                            <span>
                              <span className="block font-display text-base font-semibold text-bone">{METHOD_STYLE[m].label}</span>
                              <span className="text-[11px] text-white/45">{METHOD_STYLE[m].hint}</span>
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className="relative overflow-hidden border border-gold/40 bg-gradient-to-br from-onyx-700 to-onyx-900 p-5" data-testid="panel-merchant">
                        <div className="absolute inset-0 bg-hex opacity-60" aria-hidden="true" />
                        <div className="relative grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                          <div>
                            <p className="eyebrow">Send exactly {formatPeso(totals.total)} to</p>
                            <dl className="mt-3 space-y-1.5 text-sm">
                              <div className="flex gap-3"><dt className="w-28 text-white/45">Account name</dt><dd className="font-semibold text-bone" data-testid="text-merchant-name">{merchant.accountName}</dd></div>
                              <div className="flex gap-3"><dt className="w-28 text-white/45">{payment.method} number</dt><dd className="font-mono text-lg font-semibold tracking-wider text-gold" data-testid="text-merchant-number">{merchant.accountNumber}</dd></div>
                            </dl>
                          </div>
                          <button onClick={copyNumber} className="btn-ghost h-10 px-4 text-[11px]" data-testid="button-copy-number">
                            {copied ? <Check className="h-4 w-4 text-gold" /> : <Copy className="h-4 w-4" />} {copied ? 'Copied' : 'Copy number'}
                          </button>
                        </div>
                        <p className="relative mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-white/50">
                          <Smartphone className="mt-0.5 h-3.5 w-3.5 flex-none text-gold/70" />
                          Open {payment.method}, send the exact amount, then fill in the details from your receipt below. Orders are verified by the owner before processing.
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Sender name" error={errors.senderName}>
                          <input className={`field ${errors.senderName ? 'field-error' : ''}`} value={payment.senderName} maxLength={80} placeholder="As shown in your e-wallet" onChange={(e) => setPayment({ ...payment, senderName: e.target.value })} data-testid="input-sender-name" />
                        </Field>
                        <Field label="Sender mobile number" error={errors.senderNumber}>
                          <input className={`field ${errors.senderNumber ? 'field-error' : ''}`} value={payment.senderNumber} maxLength={16} inputMode="tel" placeholder="09XXXXXXXXX" onChange={(e) => setPayment({ ...payment, senderNumber: e.target.value.replace(/[^\d+\s-]/g, '') })} data-testid="input-sender-number" />
                        </Field>
                      </div>
                      <Field label="Reference number / transaction ID" error={errors.referenceNumber} hint={payment.method === 'GCash' ? 'GCash references are 13 digits, e.g. 1009 876 543210' : 'Found under “Reference ID” in your Maya receipt'}>
                        <input className={`field font-mono uppercase tracking-wider ${errors.referenceNumber ? 'field-error' : ''}`} value={payment.referenceNumber} maxLength={24} onChange={(e) => setPayment({ ...payment, referenceNumber: e.target.value.replace(/[^A-Za-z0-9\s]/g, '') })} data-testid="input-reference" />
                      </Field>

                      <div>
                        <span className="label">Payment receipt screenshot</span>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => fileRef.current?.click()}
                          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            pickFile(e.dataTransfer.files?.[0]);
                          }}
                          className={`flex cursor-pointer items-center gap-4 border border-dashed p-4 transition hover:border-gold ${errors.receipt ? 'border-red-500/70' : 'border-white/20'}`}
                          data-testid="dropzone-receipt"
                        >
                          {preview ? (
                            <img src={preview} alt="Receipt preview" className="h-24 w-16 flex-none object-cover" />
                          ) : (
                            <span className="flex h-16 w-16 flex-none items-center justify-center bg-onyx-800"><ImagePlus className="h-6 w-6 text-gold" /></span>
                          )}
                          <span className="min-w-0 text-sm">
                            <span className="block truncate text-bone">{file ? file.name : 'Upload or drop your receipt'}</span>
                            <span className="text-[11px] text-white/40">{file ? `${(file.size / 1024).toFixed(0)} KB · click to replace` : 'JPG, PNG or WEBP up to 5 MB'}</span>
                          </span>
                        </div>
                        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pickFile(e.target.files?.[0])} data-testid="input-receipt" />
                        {errors.receipt && <span className="mt-1 block text-xs text-red-300" role="alert">{errors.receipt}</span>}
                      </div>
                      <button onClick={goReview} className="btn-gold w-full" data-testid="button-to-review">Review order</button>
                    </section>
                  )}

                  {step === 3 && (
                    <section aria-labelledby="review-title" className="space-y-5">
                      <h3 id="review-title" className="font-display text-lg font-semibold uppercase tracking-[0.14em] text-bone">Review & confirm</h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="border border-white/10 bg-onyx-800 p-4 text-sm">
                          <p className="eyebrow mb-2">Ship to</p>
                          <p className="text-bone">{shipping.fullName}</p>
                          <p className="text-white/60">{normalizeMobile(shipping.phone)}</p>
                          <p className="text-white/60">{shipping.addressLine}, {shipping.city}, {shipping.province} {shipping.postalCode}</p>
                        </div>
                        <div className="border border-white/10 bg-onyx-800 p-4 text-sm">
                          <p className="eyebrow mb-2">Payment · {payment.method}</p>
                          <p className="text-bone">{payment.senderName}</p>
                          <p className="text-white/60">{normalizeMobile(payment.senderNumber)}</p>
                          <p className="font-mono text-white/60">Ref {payment.referenceNumber.replace(/\s/g, '').toUpperCase()}</p>
                          <p className="mt-1 text-white/40">To {merchant.accountName} · {merchant.accountNumber}</p>
                        </div>
                      </div>
                      {preview && <img src={preview} alt="Receipt to be submitted" className="max-h-56 border border-white/10 object-contain" />}
                      {serverError && (
                        <p className="flex items-start gap-2 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200" role="alert" data-testid="text-checkout-error">
                          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" /> {serverError}
                        </p>
                      )}
                      <button onClick={submit} disabled={submitting || !items.length} className="btn-gold w-full" data-testid="button-place-order">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                        {submitting ? 'Submitting…' : `Place order · ${formatPeso(totals.total)}`}
                      </button>
                      <p className="text-center text-[11px] text-white/40">By placing your order you confirm the payment above was sent to {merchant.accountNumber}.</p>
                    </section>
                  )}
                </div>

                <aside className="hidden min-h-0 flex-col border-l border-white/10 bg-onyx-800 lg:flex">
                  <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-6 py-6">
                    <p className="eyebrow mb-4">Order summary</p>
                    <ul className="space-y-3">
                      {items.map((i) => (
                        <li key={i.key} className="flex items-center gap-3 text-sm">
                          <span className="relative flex-none">
                            <img src={resolveImage(i.imageUrl)} alt="" className="h-16 w-12 object-cover" />
                            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-onyx">{i.quantity}</span>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-bone">{i.name}</span>
                            <span className="text-[11px] text-white/45">Size {i.size}</span>
                          </span>
                          <span className="text-white/80">{formatPeso(i.price * i.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-t border-white/10 px-6 py-5">
                    <OrderSummary totals={totals} compact />
                  </div>
                </aside>
                <div className="border-t border-white/10 bg-onyx-800 px-5 py-4 lg:hidden">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">{totals.tier ? `Tier ${totals.tier.id} · −${formatPeso(totals.discountAmount)}` : 'Total'}</span>
                    <span className="font-display text-lg font-semibold text-gold">{formatPeso(totals.total)}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
