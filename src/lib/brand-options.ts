// Brand onboarding + preferences options (shared by the wizard and settings).

export const BRAND_GOALS: { value: string; label: string; hint: string }[] = [
  { value: "ugc", label: "UGC", hint: "Content I can use in my own ads" },
  { value: "sponsored", label: "Sponsored posts", hint: "Creators post to their own followers" },
  { value: "affiliate", label: "Affiliate", hint: "Drive sales on commission" },
  { value: "local_events", label: "Local & events", hint: "Promote a local shop or event" },
  { value: "other", label: "Something else", hint: "" },
];

/** Known goals only, in the order shown on the form. Drops anything else. */
export function cleanGoals(values: string[]): string[] {
  const picked = new Set(values);
  return BRAND_GOALS.map((goal) => goal.value).filter((value) => picked.has(value));
}

/**
 * The column is a single text field. One older value ("ugc") and several
 * ("ugc,sponsored") both come back as a list.
 */
export function parseGoals(value: string | null | undefined): string[] {
  if (!value) return [];
  return cleanGoals(value.split(",").map((part) => part.trim()));
}

export function serializeGoals(values: string[]): string | null {
  const stored = cleanGoals(values);
  return stored.length ? stored.join(",") : null;
}

export const AD_PLATFORMS: { value: string; label: string }[] = [
  { value: "meta", label: "Meta (Facebook / Instagram)" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "google", label: "Google / Display" },
];

export const CONTENT_TYPES: { value: string; label: string }[] = [
  { value: "video", label: "Video UGC" },
  { value: "photo", label: "Photos" },
];

export const BUSINESS_TYPES: { value: string; label: string }[] = [
  { value: "ecommerce", label: "E-commerce" },
  { value: "app", label: "App or software" },
  { value: "creator", label: "Creator or personal brand" },
  { value: "local", label: "Local business" },
  { value: "other", label: "Other" },
];

export const CONTACT_ROLES: { value: string; label: string }[] = [
  { value: "founder", label: "Founder / owner" },
  { value: "marketing", label: "Marketing" },
  { value: "agency", label: "Agency / freelancer" },
  { value: "other", label: "Other" },
];

export const TEAM_SIZES: { value: string; label: string }[] = [
  { value: "solo", label: "Just me" },
  { value: "2-10", label: "2–10" },
  { value: "11-50", label: "11–50" },
  { value: "50+", label: "50+" },
];
