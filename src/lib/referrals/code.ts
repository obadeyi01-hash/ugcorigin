/** A referral code is a creator handle. Anything else is ignored. */
export function cleanReferralCode(raw: string | null | undefined): string | null {
  const code = (raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 30);
  return /^[a-z0-9._-]{3,30}$/.test(code) ? code : null;
}
