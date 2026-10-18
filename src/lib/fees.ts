/** Brand-side platform/protection fee. Creators keep 100% of their rate. */
export const FEE_RATE = 0.12;

/** Platform fee in Naira for a given creator rate (Naira). */
export function feeFor(priceNaira: number): number {
  return Math.round(priceNaira * FEE_RATE);
}
