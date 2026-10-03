import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LogoMark } from './Logo';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { useLockBody } from '../lib/hooks';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_RE = /^[A-Za-z0-9_.]{3,30}$/;

function passwordChecks(pw) {
  return [
    { ok: pw.length >= 8, label: '8+ characters' },
    { ok: /[A-Z]/.test(pw), label: 'Uppercase' },
    { ok: /[a-z]/.test(pw), label: 'Lowercase' },
    { ok: /\d/.test(pw), label: 'Number' },
  ];
}

export default function AuthModal() {
  const { open, mode, reason } = useUIStore((s) => s.auth);
  const closeAuth = useUIStore((s) => s.closeAuth);
  const setAuthMode = useUIStore((s) => s.setAuthMode);
  const setCheckout = useUIStore((s) => s.setCheckout);
  const toast = useUIStore((s) => s.toast);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useLockBody(open);

  useEffect(() => {
    setErrors({});
    setServerError('');
  }, [mode, open]);

  useEffect(() => {
    if (!open) setForm({ username: '', email: '', password: '', confirmPassword: '' });
  }, [open]);

  const isRegister = mode === 'register';

  const validate = () => {
    const e = {};
    if (isRegister && !USERNAME_RE.test(form.username.trim())) e.username = '3–30 letters, numbers, _ or .';
    if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email address.';
    if (isRegister) {
      if (!passwordChecks(form.password).every((c) => c.ok)) e.password = 'Password does not meet the requirements.';
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';
    } else if (!form.password) e.password = 'Password is required.';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    setServerError('');
    try {
      const user = isRegister
        ? await register({ username: form.username.trim(), email: form.email.trim(), password: form.password, confirmPassword: form.confirmPassword })
        : await login({ email: form.email.trim(), password: form.password });
      toast(isRegister ? `Welcome to SOVRAXION MNL, ${user.username}.` : `Welcome back, ${user.username}.`, 'success');
      closeAuth();
      if (reason === 'checkout') setTimeout(() => setCheckout(true), 250);
      else if (user.isOwner) navigate('/admin');
    } catch (err) {
      if (err.details && typeof err.details === 'object') setErrors(err.details);
      setServerError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && !loading && closeAuth()}
          role="dialog"
          aria-modal="true"
          aria-label={isRegister ? 'Create account' : 'Sign in'}
          onKeyDown={(e) => e.key === 'Escape' && !loading && closeAuth()}
          data-testid="modal-auth"
        >
          <motion.div
            className="relative w-full max-w-md overflow-hidden border border-gold/25 bg-onyx-900"
            initial={{ y: 30, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gold-grad" aria-hidden="true" />
            <button onClick={closeAuth} className="absolute right-3 top-3 p-2 text-white/50 hover:text-gold" aria-label="Close" data-testid="button-close-auth">
              <X className="h-5 w-5" />
            </button>
            <div className="px-7 pb-7 pt-9">
              <LogoMark className="h-10 w-10" />
              <h2 className="mt-5 font-display text-2xl font-semibold uppercase tracking-[0.1em] text-bone">{isRegister ? 'Join the crew' : 'Welcome back'}</h2>
              <p className="mt-1 text-sm text-white/50">
                {reason === 'checkout' ? 'Sign in or create an account to complete your order.' : isRegister ? 'Create an account to checkout and track orders.' : 'Sign in to your SOVRAXION MNL account.'}
              </p>

              <div className="mt-6 grid grid-cols-2 border border-white/10 p-1" role="tablist">
                {['login', 'register'].map((m) => (
                  <button
                    key={m}
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => setAuthMode(m)}
                    className={`h-9 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${mode === m ? 'bg-gold text-onyx' : 'text-white/55 hover:text-bone'}`}
                    data-testid={`tab-${m}`}
                  >
                    {m === 'login' ? 'Sign in' : 'Register'}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} noValidate className="mt-6 space-y-4">
                {isRegister && (
                  <label className="block">
                    <span className="label">Username</span>
                    <input className={`field ${errors.username ? 'field-error' : ''}`} value={form.username} onChange={set('username')} maxLength={30} autoComplete="username" data-testid="input-username" />
                    {errors.username && <span className="mt-1 block text-xs text-red-300">{errors.username}</span>}
                  </label>
                )}
                <label className="block">
                  <span className="label">Email</span>
                  <input type="email" className={`field ${errors.email ? 'field-error' : ''}`} value={form.email} onChange={set('email')} maxLength={254} autoComplete="email" data-testid="input-email" />
                  {errors.email && <span className="mt-1 block text-xs text-red-300">{errors.email}</span>}
                </label>
                <label className="block">
                  <span className="label">Password</span>
                  <span className="relative block">
                    <input
                      type={showPw ? 'text' : 'password'}
                      className={`field pr-12 ${errors.password ? 'field-error' : ''}`}
                      value={form.password}
                      onChange={set('password')}
                      maxLength={128}
                      autoComplete={isRegister ? 'new-password' : 'current-password'}
                      data-testid="input-password"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 text-white/40 hover:text-gold" aria-label={showPw ? 'Hide password' : 'Show password'}>
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                  {errors.password && <span className="mt-1 block text-xs text-red-300">{errors.password}</span>}
                </label>
                {isRegister && (
                  <>
                    <ul className="grid grid-cols-4 gap-1.5">
                      {passwordChecks(form.password).map((c) => (
                        <li key={c.label} className={`border px-1 py-1 text-center text-[10px] ${c.ok ? 'border-gold/50 text-gold' : 'border-white/10 text-white/35'}`}>{c.label}</li>
                      ))}
                    </ul>
                    <label className="block">
                      <span className="label">Confirm password</span>
                      <input type={showPw ? 'text' : 'password'} className={`field ${errors.confirmPassword ? 'field-error' : ''}`} value={form.confirmPassword} onChange={set('confirmPassword')} maxLength={128} autoComplete="new-password" data-testid="input-confirm-password" />
                      {errors.confirmPassword && <span className="mt-1 block text-xs text-red-300">{errors.confirmPassword}</span>}
                    </label>
                  </>
                )}
                {serverError && <p className="border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200" role="alert" data-testid="text-auth-error">{serverError}</p>}
                <button type="submit" disabled={loading} className="btn-gold w-full" data-testid="button-auth-submit">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isRegister ? 'Create account' : 'Sign in'}
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
