import { Chip } from "@/components/ui/chip";

export const PRIVATE_BRAND = "Verified brand";
export const PRIVATE_BRAND_NOTE = "Company name stays private until you are hired.";

export function BrandByline({ conceal, company }: { conceal: boolean; company: string | null }) {
  if (conceal) {
    return (
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3">
        <span className="rounded-full bg-accent-tint px-2 py-0.5 text-2xs font-semibold text-accent">{PRIVATE_BRAND}</span>
        <span>{PRIVATE_BRAND_NOTE}</span>
      </p>
    );
  }
  return <p className="text-xs text-ink-3">{company || "A brand"}</p>;
}

/** Location, format, niches, and shoot tags, each styled as its own kind. */
export function BriefTagList({
  location,
  format,
  niches,
  tags,
}: {
  location: string | null;
  format: string | null;
  niches: string[];
  tags: string[];
}) {
  if (!location && !format && niches.length === 0 && tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {location ? <Chip className="border-accent/30 bg-accent-tint text-accent">{location}</Chip> : null}
      {format ? <Chip className="border-line bg-surface-2 text-ink">{format}</Chip> : null}
      {niches.map((n) => (
        <Chip key={`niche-${n}`}>{n}</Chip>
      ))}
      {tags.map((t) => (
        <Chip key={`tag-${t}`} className="border-transparent bg-paper text-ink-2">
          {t}
        </Chip>
      ))}
    </div>
  );
}
