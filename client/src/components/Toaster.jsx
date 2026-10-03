import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';

const ICONS = { success: CheckCircle2, error: AlertCircle, default: Info };

export default function Toaster() {
  const toasts = useUIStore((s) => s.toasts);
  const dismiss = useUIStore((s) => s.dismissToast);
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[120] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.tone] || ICONS.default;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              className={`pointer-events-auto flex items-start gap-3 border bg-onyx-800/95 px-4 py-3 text-sm shadow-xl backdrop-blur ${
                t.tone === 'error' ? 'border-red-500/40 text-red-100' : t.tone === 'success' ? 'border-gold/40 text-bone' : 'border-white/10 text-bone'
              }`}
              role="status"
              data-testid="toast"
            >
              <Icon className={`mt-0.5 h-4 w-4 flex-none ${t.tone === 'error' ? 'text-red-400' : 'text-gold'}`} />
              <span className="flex-1">{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="text-white/40 hover:text-bone" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
