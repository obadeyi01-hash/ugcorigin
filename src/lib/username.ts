// Username (handle) helpers. The handle is the public identity and the basis of
// the profile URL (/@handle). It is assigned once at onboarding and governed
// after that (one free change, then a paid perk) — see settings actions.

const FREE_CHANGES = 1;

/** Max number of handle changes allowed on the free plan, after onboarding. */
export const FREE_USERNAME_CHANGES = FREE_CHANGES;

/** Normalize any input to the canonical handle form. */
export function normalizeHandle(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 30);
}

export function isValidHandle(h: string): boolean {
  return /^[a-z0-9._-]{3,30}$/.test(h);
}

/**
 * Suggest a clean handle from a display name (used to prefill onboarding).
 * Not guaranteed unique — the DB unique index is the source of truth; the form
 * simply offers this as a starting point.
 */
export function suggestHandle(seed: string): string {
  const base = normalizeHandle(seed.replace(/\s+/g, ""));
  if (isValidHandle(base)) return base;
  // Pad short/empty seeds so the suggestion is always valid.
  const padded = (base || "creator") + Math.floor(1000 + Math.random() * 9000);
  return normalizeHandle(padded);
}
