// Extra brief tags that are not niches: how the work is shot, not the industry.
export const BRIEF_TAGS = [
  "On camera",
  "Voice only",
  "On location",
  "Remote friendly",
  "Product ships",
  "Captions",
  "One revision",
  "Human only",
] as const;

export type BriefTag = (typeof BRIEF_TAGS)[number];

const ALLOWED = new Set<string>(BRIEF_TAGS);

export function cleanBriefTags(input: string[]): string[] {
  const out: string[] = [];
  for (const raw of input) {
    const tag = raw.trim();
    if (!ALLOWED.has(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length >= 6) break;
  }
  return out;
}
