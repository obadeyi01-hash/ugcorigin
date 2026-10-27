import { CATEGORIES } from "@/lib/categories";

const MAX = 40;

/** Match a typed niche to the catalog, or keep a short custom label. */
export function cleanNiche(raw: string, catalog: readonly string[] = CATEGORIES): string | null {
  const trimmed = raw.replace(/\s+/g, " ").trim();
  if (trimmed.length < 2 || trimmed.length > MAX) return null;
  if (!/^[\p{L}\p{N}][\p{L}\p{N}&/.'’ -]*$/u.test(trimmed)) return null;
  const known = catalog.find((item) => item.toLowerCase() === trimmed.toLowerCase());
  return known ?? trimmed;
}

export function cleanNicheList(list: string[], catalog: readonly string[] = CATEGORIES): string[] {
  const out: string[] = [];
  for (const item of list) {
    const next = cleanNiche(item, catalog);
    if (!next || out.some((have) => have.toLowerCase() === next.toLowerCase())) continue;
    out.push(next);
    if (out.length === 5) break;
  }
  return out;
}
