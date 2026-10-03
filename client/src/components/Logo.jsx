import { useId } from 'react';

export function LogoMark({ className = 'h-8 w-8', animated = false }) {
  const gid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none">
      <defs>
        <linearGradient id={`lg-${gid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff1b8" />
          <stop offset="0.35" stopColor="#ffd700" />
          <stop offset="0.65" stopColor="#d4af37" />
          <stop offset="1" stopColor="#8c6d1f" />
        </linearGradient>
      </defs>
      <path d="M32 4 56.2 18v28L32 60 7.8 46V18Z" stroke={`url(#lg-${gid})`} strokeWidth="3.2" strokeLinejoin="round" />
      <path d="M32 12.5 48.8 22.2v19.6L32 51.5 15.2 41.8V22.2Z" stroke={`url(#lg-${gid})`} strokeOpacity="0.35" strokeWidth="1.2" />
      <path
        d="M41.2 23.6c-2.1-2.4-5.3-3.6-9.1-3.6-5.5 0-8.9 2.6-8.9 6.4 0 8.7 18.2 4.6 18.2 12.9 0 3.9-3.7 6.7-9.3 6.7-4 0-7.4-1.3-9.8-3.9"
        stroke={`url(#lg-${gid})`}
        strokeWidth="4.2"
        strokeLinecap="round"
        className={animated ? 'animate-pulse' : undefined}
      />
    </svg>
  );
}

export default function Logo({ compact = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`} role="img" aria-label="SOVRAXION MNL">
      <LogoMark className={compact ? 'h-7 w-7' : 'h-9 w-9'} />
      <span className="flex flex-col leading-none">
        <span className={`font-display font-semibold tracking-[0.22em] text-gold-grad ${compact ? 'text-[15px]' : 'text-lg'}`}>SOVRAXION</span>
        <span className="mt-1 font-display text-[9px] font-medium tracking-[0.62em] text-white/60">MNL</span>
      </span>
    </span>
  );
}
