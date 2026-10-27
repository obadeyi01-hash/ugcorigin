/** Brand-side platform/protection fee. Creators keep 100% of their rate. */
export const FEE_RATE = 0.12;

/** Nigeria VAT, in basis points. 750 = 7.5%. Admin can change the live number. */
export const DEFAULT_TAX_BPS = 750;
export const MAX_TAX_BPS = 2500;

/** Platform fee in Naira for a given creator rate (Naira). */
export function feeFor(priceNaira: number): number {
  return Math.round(Math.max(0, priceNaira) * FEE_RATE);
}

/** Tax in Naira. `taxBps` is basis points: 750 means 7.5%. */
export function taxFor(priceNaira: number, taxBps = DEFAULT_TAX_BPS): number {
  const bps = Math.min(MAX_TAX_BPS, Math.max(0, Math.round(taxBps)));
  return Math.round((Math.max(0, priceNaira) * bps) / 10_000);
}

export function taxBpsFromPercent(percent: number): number | null {
  if (!Number.isFinite(percent) || percent < 0 || percent > MAX_TAX_BPS / 100) return null;
  return Math.round(percent * 100);
}

export function taxPercentLabel(taxBps: number): string {
  const percent = Math.round(taxBps) / 100;
  return Number.isInteger(percent) ? `${percent}%` : `${percent.toFixed(1)}%`;
}

/** Basis points stored on the Paystack charge. Missing means a charge from before tax. */
export function taxBpsFromMetadata(metadata: unknown): number {
  if (!metadata || typeof metadata !== "object") return 0;
  const raw = (metadata as { taxBps?: unknown }).taxBps;
  if (raw == null || raw === "") return 0;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.min(MAX_TAX_BPS, Math.max(0, Math.round(n)));
}

/** What the brand is charged: creator rate + platform fee + tax. */
export function brandCharge(priceNaira: number, feeNaira: number, taxNaira: number): number {
  return Math.max(0, Math.round(priceNaira)) + Math.max(0, Math.round(feeNaira)) + Math.max(0, Math.round(taxNaira));
}
