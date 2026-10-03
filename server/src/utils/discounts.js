export const FREEBIE_SLUG = 'puzzled-keychain';

export const DISCOUNT_TIERS = Object.freeze([
  Object.freeze({ id: 4, threshold: 4000, rate: 0.15, label: '15% OFF + Free Puzzled Keychain', freebie: true }),
  Object.freeze({ id: 3, threshold: 2500, rate: 0.12, label: '12% OFF + Free Puzzled Keychain', freebie: true }),
  Object.freeze({ id: 2, threshold: 1500, rate: 0.1, label: '10% OFF', freebie: false }),
  Object.freeze({ id: 1, threshold: 750, rate: 0.08, label: '8% OFF', freebie: false }),
]);

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export function resolveTier(subtotal) {
  const value = Number(subtotal) || 0;
  return DISCOUNT_TIERS.find((tier) => value >= tier.threshold) || null;
}

export function nextTier(subtotal) {
  const value = Number(subtotal) || 0;
  const ascending = [...DISCOUNT_TIERS].sort((a, b) => a.threshold - b.threshold);
  return ascending.find((tier) => value < tier.threshold) || null;
}

export function computeTotals(subtotal) {
  const safeSubtotal = round2(Math.max(0, Number(subtotal) || 0));
  const tier = resolveTier(safeSubtotal);
  const discountRate = tier ? tier.rate : 0;
  const discountAmount = round2(safeSubtotal * discountRate);
  const total = round2(safeSubtotal - discountAmount);
  const upcoming = nextTier(safeSubtotal);
  return {
    subtotal: safeSubtotal,
    tier,
    discountRate,
    discountAmount,
    total,
    freebieEligible: Boolean(tier && tier.freebie),
    nextTier: upcoming,
    amountToNextTier: upcoming ? round2(upcoming.threshold - safeSubtotal) : 0,
  };
}
