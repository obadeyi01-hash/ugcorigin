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

/**
 * The handle is no longer entered at onboarding — we auto-assign one from the
 * creator's name (falling back to the email local-part). This returns a handle
 * guaranteed unique against existing rows by appending a numeric suffix. The DB
 * unique index remains the final arbiter; the insert still retries on conflict.
 *
 * `taken(handle)` resolves true when the handle already exists.
 */
export async function generateUniqueHandle(
  seed: string,
  taken: (handle: string) => Promise<boolean>,
): Promise<string> {
  const base = suggestHandle(seed);
  if (!(await taken(base))) return base;
  // Append a growing numeric suffix, trimming the base so we stay within 30 chars.
  for (let i = 2; i < 10000; i++) {
    const suffix = String(i);
    const candidate = normalizeHandle(base.slice(0, 30 - suffix.length) + suffix);
    if (isValidHandle(candidate) && !(await taken(candidate))) return candidate;
  }
  // Extremely unlikely fallback: random tail.
  return normalizeHandle(base.slice(0, 22) + Date.now().toString().slice(-6));
}
