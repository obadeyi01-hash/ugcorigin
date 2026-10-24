// Founder-tunable admin-security knobs, read from the environment so they can be
// changed without a deploy-code change. Kept in one place so the PR / ops docs
// have a single source of truth.

/**
 * Escrow releases/refunds at or above this many naira require a SECOND admin to
 * approve before the money moves (dual control). Below it, the existing one-step
 * path is kept. Configure with ADMIN_DUAL_CONTROL_THRESHOLD_NAIRA; defaults to
 * ₦100,000. Set to 0 to require dual control on every release/refund.
 */
export function dualControlThresholdNaira(): number {
  const raw = process.env.ADMIN_DUAL_CONTROL_THRESHOLD_NAIRA;
  const n = raw == null ? NaN : Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 100_000;
}

/** True when `amount` must go through two-admin approval. */
export function requiresDualControl(amountNaira: number): boolean {
  return amountNaira >= dualControlThresholdNaira();
}

/**
 * Whether admins must reach assurance level aal2 (verified TOTP) before using the
 * admin console. Hard-required by default; set ADMIN_MFA_REQUIRED=false only for a
 * deliberate transition window (e.g. before the team has enrolled).
 */
export function adminMfaRequired(): boolean {
  return process.env.ADMIN_MFA_REQUIRED !== "false";
}
