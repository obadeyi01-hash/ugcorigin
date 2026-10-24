import Image from "next/image";
import Link from "next/link";
import { MapPin, ArrowUpRight } from "lucide-react";
import { Rating } from "@/components/ui/rating";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { SaveButton } from "@/components/marketplace/save-button";
import { cn, formatNaira } from "@/lib/utils";

export type Creator = {
  name: string;
  handle?: string;
  image?: string;
  location: string;
  niches: string[];
  startingRate: number;
  featured?: boolean;
  /** Active Creator Pro — shows a small trust badge. */
  pro?: boolean;
  verified?: boolean;
  /** Server-truth only, rendered when real data exists. Never fabricated. */
  rating?: number;
  reviews?: number;
  gigsCompleted?: number;
  /** For the save (like) control — only when a brand is viewing. */
  id?: string;
  canSave?: boolean;
  saved?: boolean;
  /** Prioritize the image for above-the-fold LCP. */
  priority?: boolean;
};

/**
 * Two coherent-but-distinct treatments so sections don't all look identical:
 *  - "grid"    : directory / saved. Portrait media + a tight 2-line body.
 *  - "overlay" : homepage strips. Shortest card — name + rate live ON the image,
 *                with a little more detail revealed on hover. Editorial, dense.
 * Both share the same hover language: image zoom + reveal, no vertical "jump".
 */
export type CreatorCardVariant = "grid" | "overlay";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export function CreatorCard({
  creator,
  variant = "grid",
}: {
  creator: Creator;
  variant?: CreatorCardVariant;
}) {
  const href = creator.handle ? `/@${creator.handle}` : null;
  const topNiche = creator.niches[0];

  const media =
    creator.image ? (
      <Image
        src={creator.image}
        alt={`${creator.name}, creator`}
        fill
        sizes="(max-width: 640px) 72vw, (max-width: 1024px) 33vw, 300px"
        priority={creator.priority}
        data-zoom
        className="object-cover"
      />
    ) : (
      <div data-zoom className="u-grain grid h-full w-full place-items-center bg-gradient-to-b from-accent-tint/60 to-surface-2">
        <span className="font-display text-3xl font-bold text-accent/70">{initials(creator.name)}</span>
      </div>
    );

  const featuredBadge = creator.featured ? (
    <span className="rounded-full bg-accent px-2.5 py-1 text-2xs font-semibold text-accent-ink shadow-sm">Featured</span>
  ) : null;

  const saveControl =
    creator.canSave && creator.id ? (
      <div className="absolute right-2.5 top-2.5 z-10">
        <SaveButton creatorId={creator.id} initialSaved={creator.saved} />
      </div>
    ) : null;

  let card: React.ReactNode;

  if (variant === "overlay") {
    // Info-on-image: the shortest, most editorial card. Essentials (name, rate)
    // stay visible for touch; location + niche reveal on hover as the "little more".
    card = (
      <article className="u-card u-zoom group relative aspect-[5/6] overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-sm">
        {media}
        {/* legibility scrim */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-obsidian/85 via-obsidian/15 to-transparent" />

        <div className="absolute inset-x-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {featuredBadge}
          {creator.rating !== undefined && (
            <Rating value={creator.rating} count={creator.reviews} className="rounded-full bg-chalk/95 px-2 py-0.5 shadow-sm backdrop-blur" />
          )}
        </div>
        {saveControl}

        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="flex min-w-0 items-center gap-1.5">
            <h3 className="min-w-0 truncate font-display text-sm font-semibold text-chalk">{creator.name}</h3>
            {creator.verified && <VerifiedBadge compact />}
          </div>
          {/* reveal-on-hover: location + top niche */}
          <div className="u-detail mt-1 flex items-center gap-2 text-2xs text-chalk/80">
            <span className="inline-flex min-w-0 items-center gap-1 truncate">
              <MapPin className="size-3 shrink-0" aria-hidden />
              <span className="truncate">{creator.location}</span>
            </span>
            {topNiche && <span className="shrink-0 rounded-full bg-chalk/15 px-2 py-0.5 font-medium text-chalk">{topNiche}</span>}
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-chalk">
              <span className="font-normal text-chalk/70">From </span>
              {formatNaira(creator.startingRate)}
            </span>
            <ArrowUpRight className="u-detail size-4 text-chalk/90" aria-hidden />
          </div>
        </div>
      </article>
    );
  } else {
    // Directory grid: portrait media + a compact body. Niches reveal on the image.
    card = (
      <article className="u-card u-zoom group overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="relative aspect-[5/6] overflow-hidden bg-surface-2">
          {media}

          <div className="absolute inset-x-2.5 top-2.5 flex flex-col items-start gap-1.5">
            {featuredBadge}
            {creator.rating !== undefined && (
              <Rating value={creator.rating} count={creator.reviews} className="rounded-full bg-chalk/95 px-2 py-0.5 shadow-sm backdrop-blur" />
            )}
          </div>
          {saveControl}

          {creator.niches.length > 0 && (
            <div className="u-detail absolute inset-x-0 bottom-0 bg-gradient-to-t from-obsidian/85 to-transparent p-2.5 pt-8">
              <div className="flex flex-wrap gap-1.5">
                {creator.niches.slice(0, 2).map((n) => (
                  <span key={n} className="rounded-full bg-chalk/15 px-2 py-0.5 text-2xs font-medium text-chalk backdrop-blur">
                    {n}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0 p-2.5 sm:p-3">
          <div className="flex min-w-0 items-center gap-1.5">
            <h3 className="min-w-0 truncate font-display text-sm font-semibold text-ink">{creator.name}</h3>
            {creator.verified && <VerifiedBadge compact />}
            {creator.pro && (
              <span className="shrink-0 rounded-full bg-ink px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-paper">
                Pro
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="flex min-w-0 items-center gap-1 truncate text-xs text-ink-3">
              <MapPin className="size-3 shrink-0" aria-hidden />
              <span className="truncate">{creator.location}</span>
            </p>
            <span className="shrink-0 text-xs font-semibold text-ink">
              <span className="font-normal text-ink-3">From </span>
              {formatNaira(creator.startingRate)}
            </span>
          </div>
        </div>
      </article>
    );
  }

  return href ? (
    <Link href={href} className={cn("block", variant === "overlay" && "h-full")}>
      {card}
    </Link>
  ) : (
    card
  );
}
