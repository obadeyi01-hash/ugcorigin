// What a creator profile needs to be "brand-ready", computed live from the
// profile + its media counts + verification flags (not the stored `completeness`
// score, which only reflects the text fields captured at onboarding). The point
// is to give creators concrete next steps that run ALONGSIDE verification, so
// nobody stalls at the identity step waiting to be told what to do next.

/** Minimum sample videos we ask every creator to upload before they look ready. */
export const MIN_SAMPLE_VIDEOS = 3;

export type ChecklistItem = {
  key: string;
  label: string;
  done: boolean;
  /** Where the "do it" link points — a route, or a `#anchor` on the dashboard. */
  href: string;
  cta: string;
};

export type CreatorCompletion = {
  items: ChecklistItem[];
  done: number;
  total: number;
  percent: number;
  /** True once every item is checked — the card can hide itself. */
  complete: boolean;
};

export function buildCreatorChecklist(i: {
  avatarUrl: string | null;
  bio: string | null;
  niches: string[] | null;
  startingRate: number | null;
  videoCount: number;
  portfolioCount: number;
  identityVerified: boolean;
  bankVerified: boolean;
}): CreatorCompletion {
  const niches = i.niches ?? [];
  const shownVideos = Math.min(i.videoCount, MIN_SAMPLE_VIDEOS);

  const items: ChecklistItem[] = [
    { key: "photo", label: "Add a profile photo", done: !!i.avatarUrl, href: "/settings", cta: "Add photo" },
    { key: "bio", label: "Write a short bio", done: !!i.bio && i.bio.trim().length >= 40, href: "/settings", cta: "Write bio" },
    { key: "niches", label: "Pick the niches you create for", done: niches.length >= 1, href: "/settings", cta: "Pick niches" },
    { key: "rate", label: "Set your starting rate", done: (i.startingRate ?? 0) > 0, href: "/settings#starting-rate", cta: "Set rate" },
    { key: "videos", label: `Upload ${MIN_SAMPLE_VIDEOS} sample videos (${shownVideos}/${MIN_SAMPLE_VIDEOS})`, done: i.videoCount >= MIN_SAMPLE_VIDEOS, href: "#videos", cta: "Add videos" },
    { key: "portfolio", label: "Link your socials or past work", done: i.portfolioCount >= 1, href: "#portfolio", cta: "Add links" },
    { key: "identity", label: "Verify your identity", done: i.identityVerified, href: "/verify", cta: "Verify" },
    { key: "bank", label: "Add your payout bank", done: i.bankVerified, href: "/verify", cta: "Add bank" },
  ];

  const done = items.filter((x) => x.done).length;
  const total = items.length;
  return { items, done, total, percent: Math.round((done / total) * 100), complete: done === total };
}
