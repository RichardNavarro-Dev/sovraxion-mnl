import { motion } from 'framer-motion';
import { Gift, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DISCOUNT_TIERS } from '../lib/discounts';
import { formatPeso, formatPesoShort } from '../lib/format';
import { useCartTotals } from '../store/useCartStore';
import { useUIStore } from '../store/useUIStore';

const ASC_TIERS = [...DISCOUNT_TIERS].sort((a, b) => a.threshold - b.threshold);

export function TierLadder({ compact = false }) {
  const totals = useCartTotals();
  const activeId = totals.tier?.id ?? 0;

  return (
    <div className={`grid gap-px bg-white/10 ${compact ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`} data-testid="tier-ladder">
      {ASC_TIERS.map((tier, i) => {
        const active = tier.id === activeId;
        const reached = totals.subtotal >= tier.threshold;
        return (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className={`relative overflow-hidden bg-onyx-800 ${compact ? 'p-4' : 'p-5 sm:p-7'} ${active ? 'ring-1 ring-inset ring-gold' : ''}`}
            data-testid={`card-tier-${tier.id}`}
          >
            {active && <span className="absolute inset-0 bg-gradient-to-br from-gold/15 via-transparent to-transparent" aria-hidden="true" />}
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.3em] text-white/45">Tier {tier.id}</span>
                {reached && (
                  <span className="text-[10px] uppercase tracking-[0.2em] text-gold" data-testid={`status-tier-${tier.id}`}>
                    {active ? 'Active' : 'Unlocked'}
                  </span>
                )}
              </div>
              <p className={`mt-3 font-display font-semibold leading-none text-gold-grad ${compact ? 'text-3xl' : 'text-5xl sm:text-6xl'}`}>
                {Math.round(tier.rate * 100)}%<span className="ml-1 text-[0.4em] tracking-[0.12em]">OFF</span>
              </p>
              <p className="mt-3 text-sm text-white/70">
                Orders worth <span className="font-semibold text-bone">{formatPesoShort(tier.threshold)}+</span>
              </p>
              {tier.freebie ? (
                <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-gold-pale">
                  <Gift className="h-3.5 w-3.5" /> + Free Puzzled Keychain
                </p>
              ) : (
                <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/30">Auto-applied</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function HeroBanner() {
  const navigate = useNavigate();
  const setCart = useUIStore((s) => s.setCart);
  const totals = useCartTotals();

  return (
    <section aria-labelledby="hero-title" className="relative">
      <div className="relative min-h-[92svh] overflow-hidden">
        <motion.img
          src="./products/hero-campaign.jpg"
          alt="SOVRAXION MNL campaign: two models in black and tie-dye streetwear on a Manila rooftop at night"
          className="absolute inset-0 h-full w-full object-cover object-[70%_center]"
          initial={{ scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-onyx via-onyx/75 to-onyx/10" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-onyx via-transparent to-onyx/40" aria-hidden="true" />
        <div className="absolute inset-0 bg-hex opacity-60 [mask-image:linear-gradient(90deg,black,transparent_60%)]" aria-hidden="true" />

        <div className="relative mx-auto flex min-h-[92svh] max-w-[1440px] flex-col justify-end px-5 pb-16 pt-36 sm:px-8 lg:justify-center lg:pb-24">
          <motion.p className="eyebrow flex items-center gap-2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Sparkles className="h-3.5 w-3.5" /> Limited payday event
          </motion.p>
          <motion.h1
            id="hero-title"
            className="mt-4 max-w-3xl font-display text-[15vw] font-bold uppercase leading-[0.86] tracking-tight text-bone sm:text-8xl lg:text-[8.5rem]"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            Stacked
            <br />
            <span className="text-gold-grad">Payday</span>
          </motion.h1>
          <motion.p
            className="mt-6 max-w-md text-base leading-relaxed text-white/70 sm:text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            The more you stack, the more you save. Tiered discounts up to 15% and a free Puzzled Keychain — calculated live in your bag.
          </motion.p>
          <motion.div className="mt-8 flex flex-wrap gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            <button onClick={() => navigate('/shop')} className="btn-gold" data-testid="button-hero-shop">Shop the drop</button>
            <button onClick={() => navigate('/shop?sale=true')} className="btn-ghost" data-testid="button-hero-sale">View sale</button>
          </motion.div>
          {totals.subtotal > 0 && (
            <motion.button
              onClick={() => setCart(true)}
              className="mt-6 w-fit border border-gold/30 bg-onyx/70 px-4 py-2 text-left text-xs text-white/70 backdrop-blur hover:border-gold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              data-testid="button-hero-progress"
            >
              Bag subtotal <span className="text-bone">{formatPeso(totals.subtotal)}</span>
              {totals.nextTier ? (
                <> · add <span className="text-gold">{formatPeso(totals.amountToNextTier)}</span> to unlock {Math.round(totals.nextTier.rate * 100)}% off</>
              ) : (
                <> · <span className="text-gold">max tier unlocked</span></>
              )}
            </motion.button>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
        <div className="relative z-10 -mt-10 border border-white/10 bg-onyx-900 shadow-gold sm:-mt-14">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-7">
            <div>
              <p className="eyebrow">Stacked Payday tiers</p>
              <p className="mt-1 font-display text-lg font-semibold text-bone">Discounts apply automatically at checkout</p>
            </div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Based on bag subtotal · No code needed</p>
          </div>
          <TierLadder />
        </div>
      </div>
    </section>
  );
}
