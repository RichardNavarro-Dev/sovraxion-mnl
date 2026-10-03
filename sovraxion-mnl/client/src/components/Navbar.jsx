import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, LogOut, Menu, Package, Search, ShoppingBag, User, X } from 'lucide-react';
import Logo from './Logo';
import { useAuthStore } from '../store/useAuthStore';
import { selectCount, useCartStore } from '../store/useCartStore';
import { useUIStore } from '../store/useUIStore';
import { api, resolveImage } from '../lib/api';
import { formatPeso } from '../lib/format';

export const MENU_ITEMS = [
  { label: 'Shop', to: '/shop', note: 'All drops' },
  { label: 'Sale', to: '/shop?sale=true', note: 'Marked down' },
  { label: 'Collections', to: '/collections', note: 'Dye Lab · Hex Core' },
  { label: 'Accessories', to: '/shop?category=Accessories', note: 'Caps · Totes' },
  { label: 'Collectibles', to: '/shop?category=Collectibles', note: 'Keychains' },
  { label: 'Our Story', to: '/our-story', note: 'Made in Manila' },
  { label: 'FAQ', to: '/faq', note: 'Shipping · Payments' },
  { label: 'Articles', to: '/articles', note: 'Journal' },
];

const ANNOUNCEMENTS = [
  'Stacked Payday — up to 15% off + free Puzzled Keychain',
  'Pay via GCash or Maya · 0963 668 8618',
  'Nationwide shipping from Parañaque City',
  '8% off ₱750+ · 10% off ₱1,500+ · 12% off ₱2,500+ · 15% off ₱4,000+',
];

function AnnouncementBar() {
  const row = [...ANNOUNCEMENTS, ...ANNOUNCEMENTS];
  return (
    <div className="relative h-8 overflow-hidden border-b border-gold/20 bg-gold-grad text-onyx" data-testid="bar-announcement">
      <div className="flex h-full w-max animate-marquee items-center whitespace-nowrap">
        {row.map((t, i) => (
          <span key={i} className="flex items-center px-8 text-[11px] font-semibold uppercase tracking-[0.22em]">
            <span className="mr-8 inline-block h-1.5 w-1.5 rotate-45 bg-onyx/70" aria-hidden="true" />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function SearchOverlay() {
  const open = useUIStore((s) => s.searchOpen);
  const setSearch = useUIStore((s) => s.setSearch);
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
    else {
      setTerm('');
      setResults([]);
      setError('');
    }
  }, [open]);

  useEffect(() => {
    const q = term.trim();
    if (q.length < 2) {
      setResults([]);
      return undefined;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.get(`/api/products?search=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        setResults(data.products.slice(0, 6));
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [term]);

  const submit = (e) => {
    e.preventDefault();
    const q = term.trim();
    if (!q) return;
    setSearch(false);
    navigate(`/shop?search=${encodeURIComponent(q)}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] bg-onyx/95 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Search products"
          onKeyDown={(e) => e.key === 'Escape' && setSearch(false)}
        >
          <div className="mx-auto max-w-3xl px-5 pt-24">
            <form onSubmit={submit} className="flex items-center gap-3 border-b border-gold/40 pb-3">
              <Search className="h-5 w-5 text-gold" aria-hidden="true" />
              <input
                ref={inputRef}
                value={term}
                onChange={(e) => setTerm(e.target.value.slice(0, 60))}
                placeholder="Search tees, hoodies, keychains…"
                className="flex-1 bg-transparent font-display text-2xl text-bone outline-none placeholder:text-white/25"
                aria-label="Search"
                data-testid="input-search"
              />
              <button type="button" onClick={() => setSearch(false)} className="p-2 text-white/60 hover:text-gold" aria-label="Close search" data-testid="button-close-search">
                <X className="h-6 w-6" />
              </button>
            </form>
            <div className="mt-6 min-h-[120px]">
              {loading && <p className="text-sm text-white/50">Searching…</p>}
              {error && <p className="text-sm text-red-400">{error}</p>}
              {!loading && term.trim().length >= 2 && results.length === 0 && !error && (
                <p className="text-sm text-white/50">No products match “{term.trim()}”.</p>
              )}
              <ul className="grid gap-3 sm:grid-cols-2">
                {results.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/product/${p.slug}`}
                      onClick={() => setSearch(false)}
                      className="flex items-center gap-4 border border-white/5 bg-onyx-800 p-3 transition hover:border-gold/50"
                      data-testid={`link-search-result-${p.slug}`}
                    >
                      <img src={resolveImage(p.imageUrl)} alt="" className="h-16 w-12 object-cover" />
                      <span className="min-w-0">
                        <span className="block truncate font-display text-sm text-bone">{p.name}</span>
                        <span className="text-sm text-gold">{formatPeso(p.price)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MenuDrawer() {
  const open = useUIStore((s) => s.menuOpen);
  const setMenu = useUIStore((s) => s.setMenu);
  const openAuth = useUIStore((s) => s.openAuth);
  const toast = useUIStore((s) => s.toast);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const go = (to) => {
    setMenu(false);
    navigate(to);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[55] flex flex-col overflow-y-auto bg-onyx bg-hex"
          initial={{ clipPath: 'inset(0 0 100% 0)' }}
          animate={{ clipPath: 'inset(0 0 0% 0)' }}
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          onKeyDown={(e) => e.key === 'Escape' && setMenu(false)}
          data-testid="drawer-menu"
        >
          <div className="flex h-16 items-center justify-between px-5 sm:px-8">
            <button onClick={() => setMenu(false)} className="flex items-center gap-2 p-2 text-white/80 hover:text-gold" aria-label="Close menu" data-testid="button-close-menu">
              <X className="h-6 w-6" />
              <span className="hidden text-[11px] uppercase tracking-[0.28em] sm:inline">Close</span>
            </button>
            <Logo compact />
            <span className="w-10" />
          </div>
          <nav className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1.4fr_1fr]">
            <ul className="space-y-1">
              {MENU_ITEMS.map((item, i) => (
                <motion.li
                  key={item.label}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <button
                    onClick={() => go(item.to)}
                    className="group flex w-full items-baseline justify-between border-b border-white/5 py-3 text-left"
                    data-testid={`link-menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <span className="flex items-baseline gap-4">
                      <span className="font-mono text-[10px] text-gold/60">{String(i + 1).padStart(2, '0')}</span>
                      <span className="font-display text-3xl font-semibold uppercase tracking-wide text-bone transition-colors group-hover:text-gold sm:text-5xl">
                        {item.label}
                      </span>
                    </span>
                    <span className="hidden text-[11px] uppercase tracking-[0.24em] text-white/40 sm:inline">{item.note}</span>
                  </button>
                </motion.li>
              ))}
            </ul>
            <motion.aside
              className="flex flex-col gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="metal-panel p-6">
                <p className="eyebrow">Stacked Payday</p>
                <p className="mt-3 font-display text-2xl font-semibold text-bone">Up to 15% off + a free Puzzled Keychain.</p>
                <p className="mt-2 text-sm text-white/55">Discounts apply automatically in your bag — no codes needed.</p>
                <button onClick={() => go('/shop')} className="btn-gold mt-5 w-full" data-testid="button-menu-shop-now">Shop the drop</button>
              </div>
              <div className="metal-panel p-6">
                <p className="eyebrow">Account</p>
                {user ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-white/70">Signed in as <span className="text-bone">{user.username}</span></p>
                    <button onClick={() => go('/account')} className="flex items-center gap-2 text-sm text-bone hover:text-gold" data-testid="link-menu-orders">
                      <Package className="h-4 w-4" /> My orders
                    </button>
                    {user.isOwner && (
                      <button onClick={() => go('/admin')} className="flex items-center gap-2 text-sm text-gold hover:text-gold-bright" data-testid="link-menu-admin">
                        <LayoutDashboard className="h-4 w-4" /> Owner dashboard
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        await logout();
                        setMenu(false);
                        toast('Signed out.');
                        navigate('/');
                      }}
                      className="flex items-center gap-2 text-sm text-white/60 hover:text-red-300"
                      data-testid="button-menu-logout"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 flex gap-3">
                    <button onClick={() => openAuth('login')} className="btn-ghost h-10 flex-1 px-3" data-testid="button-menu-login">Sign in</button>
                    <button onClick={() => openAuth('register')} className="btn-gold h-10 flex-1 px-3" data-testid="button-menu-register">Join</button>
                  </div>
                )}
              </div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/35">Parañaque City · Metro Manila · PH</p>
            </motion.aside>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Navbar() {
  const setMenu = useUIStore((s) => s.setMenu);
  const setCart = useUIStore((s) => s.setCart);
  const setSearch = useUIStore((s) => s.setSearch);
  const openAuth = useUIStore((s) => s.openAuth);
  const count = useCartStore(selectCount);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [bump, setBump] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (count > prevCount.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 450);
      prevCount.current = count;
      return () => clearTimeout(t);
    }
    prevCount.current = count;
    return undefined;
  }, [count]);

  useEffect(() => {
    setMenu(false);
    setSearch(false);
  }, [location.pathname, location.search, setMenu, setSearch]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50" data-testid="header">
        <AnnouncementBar />
        <div
          className={`transition-all duration-300 ${
            scrolled ? 'border-b border-white/10 bg-onyx/90 backdrop-blur-xl' : 'border-b border-transparent bg-gradient-to-b from-onyx/90 to-onyx/0'
          }`}
        >
          <div className="mx-auto grid h-16 max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-3 sm:px-6">
            <div className="flex items-center gap-1">
              <button onClick={() => setMenu(true)} className="flex items-center gap-2 p-2.5 text-bone hover:text-gold" aria-label="Open menu" data-testid="button-open-menu">
                <Menu className="h-5 w-5" />
                <span className="hidden text-[11px] uppercase tracking-[0.28em] md:inline">Menu</span>
              </button>
              <button onClick={() => setSearch(true)} className="p-2.5 text-bone hover:text-gold" aria-label="Search" data-testid="button-open-search">
                <Search className="h-5 w-5" />
              </button>
              <nav className="ml-4 hidden items-center gap-6 xl:flex" aria-label="Quick links">
                {MENU_ITEMS.slice(0, 3).map((m) => (
                  <Link key={m.label} to={m.to} className="text-[11px] uppercase tracking-[0.24em] text-white/70 hover:text-gold">
                    {m.label}
                  </Link>
                ))}
              </nav>
            </div>
            <Link to="/" className="justify-self-center" aria-label="SOVRAXION MNL home" data-testid="link-home">
              <Logo compact />
            </Link>
            <div className="flex items-center justify-end gap-1">
              {user?.isOwner && (
                <button onClick={() => navigate('/admin')} className="hidden items-center gap-1.5 border border-gold/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-gold hover:bg-gold hover:text-onyx md:flex" data-testid="button-header-admin">
                  <LayoutDashboard className="h-3.5 w-3.5" /> Admin
                </button>
              )}
              <button
                onClick={() => (user ? navigate('/account') : openAuth('login'))}
                className="flex items-center gap-2 p-2.5 text-bone hover:text-gold"
                aria-label={user ? 'My account' : 'Sign in'}
                data-testid="button-account"
              >
                <User className="h-5 w-5" />
                {user && <span className="hidden max-w-[110px] truncate text-[11px] uppercase tracking-[0.2em] lg:inline">{user.username}</span>}
              </button>
              <button onClick={() => setCart(true)} className="relative p-2.5 text-bone hover:text-gold" aria-label={`Open bag, ${count} items`} data-testid="button-open-cart">
                <ShoppingBag className="h-5 w-5" />
                <motion.span
                  animate={bump ? { scale: [1, 1.45, 1] } : { scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className={`absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                    count > 0 ? 'bg-gold-bright text-onyx' : 'bg-white/15 text-white/70'
                  }`}
                  data-testid="badge-cart-count"
                >
                  {count > 99 ? '99+' : count}
                </motion.span>
              </button>
            </div>
          </div>
        </div>
      </header>
      <MenuDrawer />
      <SearchOverlay />
    </>
  );
}
