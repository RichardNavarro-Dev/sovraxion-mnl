import { Link } from 'react-router-dom';
import Logo from './Logo';
import { MENU_ITEMS } from './Navbar';

export default function Footer() {
  return (
    <footer className="relative mt-24 border-t border-white/10 bg-onyx-900">
      <div className="absolute inset-0 bg-hex opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-[1440px] gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/50">
            Premium streetwear hand-dyed and finished in Metro Manila. Heavyweight blanks, small batches, gold standard.
          </p>
        </div>
        <div>
          <p className="eyebrow">Shop</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {MENU_ITEMS.slice(0, 5).map((m) => (
              <li key={m.label}><Link to={m.to} className="text-white/60 hover:text-gold">{m.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow">Brand</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {MENU_ITEMS.slice(5).map((m) => (
              <li key={m.label}><Link to={m.to} className="text-white/60 hover:text-gold">{m.label}</Link></li>
            ))}
            <li><Link to="/account" className="text-white/60 hover:text-gold">Track order</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow">We accept</p>
          <div className="mt-4 flex gap-2">
            <span className="flex h-9 items-center rounded-sm bg-[#007dfe] px-3 font-display text-sm font-bold text-white">GCash</span>
            <span className="flex h-9 items-center rounded-sm bg-[#00b14f] px-3 font-display text-sm font-bold text-white">Maya</span>
          </div>
          <p className="mt-4 text-sm text-white/50">
            Account name <span className="text-bone">SOVRAXION MNL</span>
            <br />
            Number <span className="font-mono text-gold">0963 668 8618</span>
          </p>
        </div>
      </div>
      <div className="relative border-t border-white/5">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-5 py-5 text-[11px] uppercase tracking-[0.2em] text-white/35 sm:px-8">
          <span>© {new Date().getFullYear()} SOVRAXION MNL · Parañaque City, PH</span>
          <span>Prices in Philippine Peso (₱)</span>
        </div>
      </div>
    </footer>
  );
}
