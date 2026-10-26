export type DisputeResolution = "release" | "refund" | "partial";

/** How a dispute splits the creator's rate. The platform fee is separate. */
export function disputeShares(
  priceNaira: number,
  resolution: DisputeResolution,
  partialToCreatorNaira?: number,
): { price: number; toCreator: number; toBrand: number } {
  const price = Math.max(0, Math.round(priceNaira));
  const toCreator =
    resolution === "release"
      ? price
      : resolution === "refund"
        ? 0
        : Math.min(price, Math.max(0, Math.round(partialToCreatorNaira ?? 0)));
  return { price, toCreator, toBrand: price - toCreator };
}

/**
 * Per-view payout capped by what is still in the pool. Zero means "don't pay".
 * Callers must still compare-and-swap `spent_naira` so two approvals can't both
 * spend the same remainder.
 */
export function campaignPayoutNaira(pool: number, spent: number, views: number, ratePer1000: number): number {
  const remaining = Math.max(0, Math.round(pool) - Math.round(spent));
  const earned = Math.floor((Math.max(0, Math.round(views)) / 1000) * Math.max(0, ratePer1000));
  return Math.min(remaining, earned);
}

/** A transfer is allowed only when this call itself flipped a held escrow row. */
export function mayTransfer(escrowClaimed: boolean): boolean {
  return escrowClaimed;
}
