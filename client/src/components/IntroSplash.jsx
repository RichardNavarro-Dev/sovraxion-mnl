import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const DURATION_MS = 10000;
const WORD = 'SOVRAXION'.split('');

function buildHexField(width, height, r) {
  const w = Math.sqrt(3) * r;
  const h = 1.5 * r;
  const cols = Math.ceil(width / w) + 2;
  const rows = Math.ceil(height / h) + 2;
  const cx = width / 2;
  const cy = height / 2;
  const maxDist = Math.hypot(cx, cy);
  const cells = [];
  for (let row = -1; row < rows; row += 1) {
    for (let col = -1; col < cols; col += 1) {
      const x = col * w + (row % 2 ? w / 2 : 0);
      const y = row * h;
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 180) * (60 * i - 30);
        return `${(x + (r - 2) * Math.cos(a)).toFixed(1)},${(y + (r - 2) * Math.sin(a)).toFixed(1)}`;
      }).join(' ');
      const dist = Math.hypot(x - cx, y - cy) / maxDist;
      const seed = Math.abs(Math.sin(row * 12.9898 + col * 78.233) * 43758.5453) % 1;
      cells.push({ id: `${row}-${col}`, pts, dist, seed });
    }
  }
  return cells;
}

export default function IntroSplash({ onFinish }) {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const finishedRef = useRef(false);
  const startRef = useRef(0);

  const cells = useMemo(() => buildHexField(1600, 900, 38), []);
  const motes = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => {
        const s = Math.abs(Math.sin(i * 91.7) * 1000) % 1;
        const t = Math.abs(Math.cos(i * 53.3) * 1000) % 1;
        return { id: i, left: s * 100, top: 30 + t * 70, size: 1 + (i % 4), delay: (i % 10) * 0.35, dur: 5 + (i % 5) };
      }),
    []
  );

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setVisible(false);
  }, []);

  useEffect(() => {
    const total = reduce ? 2500 : DURATION_MS;
    startRef.current = performance.now();
    let raf = 0;
    const tick = (now) => {
      const p = Math.min(1, (now - startRef.current) / total);
      setProgress(p);
      if (p >= 0.92 && !finishedRef.current) finish();
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const hard = setTimeout(finish, total);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(hard);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [finish, reduce]);

  return (
    <AnimatePresence onExitComplete={onFinish}>
      {visible && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[100] overflow-hidden bg-onyx"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(6px)' }}
          transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
          role="dialog"
          aria-label="SOVRAXION MNL introduction"
          data-testid="intro-splash"
        >
          <style>{`
            @keyframes sovx-cell { 0% { opacity: 0; } 18% { opacity: 1; } 55% { opacity: .35; } 100% { opacity: .55; } }
            @keyframes sovx-cell-glow { 0%,100% { opacity: 0; } 45% { opacity: .9; } }
            @keyframes sovx-mote { 0% { transform: translateY(0) scale(1); opacity: 0; } 20% { opacity: .9; } 100% { transform: translateY(-38vh) scale(.4); opacity: 0; } }
            @keyframes sovx-sweep { 0% { transform: translateX(-120%) skewX(-18deg); } 100% { transform: translateX(220%) skewX(-18deg); } }
          `}</style>

          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 70% 60% at 50% 48%, #262014 0%, #15130f 32%, #0c0c0c 62%, #050505 100%)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
          />
          <div
            className="absolute inset-0 opacity-[0.18] mix-blend-overlay"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, rgba(255,255,255,.05) 0px, rgba(255,255,255,0) 1px, rgba(255,255,255,0) 3px)',
            }}
          />

          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <radialGradient id="sovx-vignette" cx="50%" cy="50%" r="60%">
                <stop offset="0" stopColor="#000" stopOpacity="0" />
                <stop offset="1" stopColor="#000" stopOpacity="0.92" />
              </radialGradient>
              <filter id="sovx-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <g>
              {cells.map((c) => (
                <polygon
                  key={c.id}
                  points={c.pts}
                  fill="none"
                  stroke="#d4af37"
                  strokeOpacity={0.22}
                  strokeWidth="1"
                  style={{
                    opacity: 0,
                    animation: reduce ? 'none' : `sovx-cell 3.2s ease-out ${0.3 + c.dist * 2.4}s forwards`,
                  }}
                />
              ))}
            </g>
            <g filter="url(#sovx-glow)">
              {cells
                .filter((c) => c.seed > 0.86)
                .map((c) => (
                  <polygon
                    key={`g-${c.id}`}
                    points={c.pts}
                    fill="#d4af37"
                    fillOpacity="0.07"
                    stroke="#ffd700"
                    strokeOpacity="0.8"
                    strokeWidth="1.4"
                    style={{
                      opacity: 0,
                      animation: reduce ? 'none' : `sovx-cell-glow ${2.4 + c.seed * 2}s ease-in-out ${1 + c.dist * 2 + c.seed * 3}s infinite`,
                    }}
                  />
                ))}
            </g>
            <rect width="1600" height="900" fill="url(#sovx-vignette)" />
          </svg>

          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            {motes.map((m) => (
              <span
                key={m.id}
                className="absolute rounded-full bg-gold-bright"
                style={{
                  left: `${m.left}%`,
                  top: `${m.top}%`,
                  width: m.size,
                  height: m.size,
                  boxShadow: '0 0 8px 2px rgba(255,215,0,.55)',
                  opacity: 0,
                  animation: reduce ? 'none' : `sovx-mote ${m.dur}s ease-out ${1.5 + m.delay}s infinite`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 flex h-full flex-col items-center justify-center px-6">
            <motion.div
              className="relative"
              initial={{ scale: 0.6, opacity: 0, rotate: -30 }}
              animate={{ scale: [0.6, 1, 1, 0.88], opacity: [0, 1, 1, 1], rotate: [-30, 0, 0, 0] }}
              transition={{ duration: reduce ? 0.6 : 6.4, times: [0, 0.42, 0.75, 1], delay: reduce ? 0 : 1.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="absolute inset-[-40%] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(255,215,0,.35) 0%, rgba(212,175,55,.08) 40%, transparent 70%)' }}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: [0, 1, 0.55], scale: [0.4, 1.2, 1] }}
                transition={{ duration: 3, delay: reduce ? 0 : 3.6 }}
              />
              <svg viewBox="0 0 64 64" className="relative h-28 w-28 sm:h-36 sm:w-36" fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="sovx-intro-gold" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#fff1b8" />
                    <stop offset="0.35" stopColor="#ffd700" />
                    <stop offset="0.65" stopColor="#d4af37" />
                    <stop offset="1" stopColor="#8c6d1f" />
                  </linearGradient>
                </defs>
                <motion.path
                  d="M32 4 56.2 18v28L32 60 7.8 46V18Z"
                  stroke="url(#sovx-intro-gold)"
                  strokeWidth="2.6"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: reduce ? 0.3 : 1.8, delay: reduce ? 0 : 2, ease: 'easeInOut' }}
                />
                <motion.path
                  d="M32 12.5 48.8 22.2v19.6L32 51.5 15.2 41.8V22.2Z"
                  stroke="url(#sovx-intro-gold)"
                  strokeOpacity="0.4"
                  strokeWidth="1"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: reduce ? 0.3 : 1.4, delay: reduce ? 0 : 2.8, ease: 'easeInOut' }}
                />
                <motion.path
                  d="M41.2 23.6c-2.1-2.4-5.3-3.6-9.1-3.6-5.5 0-8.9 2.6-8.9 6.4 0 8.7 18.2 4.6 18.2 12.9 0 3.9-3.7 6.7-9.3 6.7-4 0-7.4-1.3-9.8-3.9"
                  stroke="url(#sovx-intro-gold)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: reduce ? 0.3 : 1.6, delay: reduce ? 0 : 3.4, ease: [0.65, 0, 0.35, 1] }}
                />
              </svg>
            </motion.div>

            <div className="relative mt-8 overflow-hidden px-2 sm:mt-10">
              <div className="flex" aria-label="SOVRAXION">
                {WORD.map((ch, i) => (
                  <motion.span
                    key={`${ch}-${i}`}
                    className="text-gold-grad font-display text-[13vw] font-semibold leading-none tracking-[0.08em] sm:text-7xl md:text-8xl"
                    initial={{ y: '110%', opacity: 0, filter: 'blur(12px)' }}
                    animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 0.9, delay: reduce ? 0.1 : 4.6 + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {ch}
                  </motion.span>
                ))}
              </div>
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 w-1/3"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,250,220,.75), transparent)',
                  mixBlendMode: 'overlay',
                  transform: 'translateX(-120%) skewX(-18deg)',
                  animation: reduce ? 'none' : 'sovx-sweep 1.6s ease-in-out 6.4s 1 forwards',
                }}
              />
            </div>

            <motion.div
              className="mt-5 flex items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: reduce ? 0.2 : 5.8 }}
            >
              <motion.span
                className="h-px bg-gradient-to-r from-transparent to-gold"
                initial={{ width: 0 }}
                animate={{ width: 64 }}
                transition={{ duration: 0.9, delay: reduce ? 0.2 : 5.9 }}
              />
              <motion.span
                className="font-display text-sm font-medium text-bone sm:text-base"
                initial={{ letterSpacing: '0.1em', opacity: 0 }}
                animate={{ letterSpacing: '0.9em', opacity: 1 }}
                transition={{ duration: 1.4, delay: reduce ? 0.2 : 5.9, ease: [0.22, 1, 0.36, 1] }}
              >
                MNL
              </motion.span>
              <motion.span
                className="h-px bg-gradient-to-l from-transparent to-gold"
                initial={{ width: 0 }}
                animate={{ width: 64 }}
                transition={{ duration: 0.9, delay: reduce ? 0.2 : 5.9 }}
              />
            </motion.div>

            <motion.p
              className="mt-8 text-center text-[11px] uppercase tracking-[0.42em] text-white/55"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: reduce ? 0.3 : 7.1 }}
            >
              Forged in Manila · Streetwear Sovereignty
            </motion.p>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-6 px-6 pb-6 sm:px-10 sm:pb-8">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <span className="font-mono text-[10px] tabular-nums text-white/40">{String(Math.round(progress * 100)).padStart(3, '0')}</span>
              <div className="h-px max-w-xs flex-1 bg-white/10">
                <div className="h-px bg-gold-grad" style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
            <button
              type="button"
              onClick={finish}
              className="group inline-flex items-center gap-2 border border-white/15 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-white/70 transition hover:border-gold hover:text-gold"
              data-testid="button-skip-intro"
            >
              Skip intro
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
