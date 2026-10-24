import Image from "next/image";
import Link from "next/link";
import { MapPin, CheckCircle2 } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { PillRow } from "@/components/ui/pill-row";
import { Rating } from "@/components/ui/rating";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { SaveButton } from "@/components/marketplace/save-button";
import { formatNaira } from "@/lib/utils";

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

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export function CreatorCard({ creator }: { creator: Creator }) {
  const href = creator.handle ? `/@${creator.handle}` : null;

  const card = (
      <article className="u-lift group overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        {/* Media */}
        <div className="relative aspect-[4/5] overflow-hidden bg-surface-2">
          {creator.image ? (
            <Image
              src={creator.image}
              alt={`${creator.name}, creator`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
              priority={creator.priority}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="u-grain grid h-full w-full place-items-center bg-gradient-to-b from-accent-tint/60 to-surface-2">
              <span className="font-display text-4xl font-bold text-accent/70">
                {initials(creator.name)}
              </span>
            </div>
          )}
          {creator.featured && (
            <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-ink shadow-sm">
              Featured
            </span>
          )}
          {creator.rating !== undefined && (
            <div className="absolute bottom-3 left-3">
              <Rating value={creator.rating} count={creator.reviews} className="rounded-full bg-chalk/95 px-2.5 py-1 shadow-sm backdrop-blur" />
            </div>
          )}
          {creator.canSave && creator.id && (
            <div className="absolute right-3 top-3">
              <SaveButton creatorId={creator.id} initialSaved={creator.saved} />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="min-w-0 p-3 sm:p-4">
          <div className="flex min-w-0 items-center gap-1.5">
            <h3 className="min-w-0 truncate font-display text-sm font-semibold text-ink sm:text-base">{creator.name}</h3>
            {creator.verified && <VerifiedBadge compact />}
            {creator.pro && (
              <span className="shrink-0 rounded-full bg-ink px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-paper">
                Pro
              </span>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink-3">
            <MapPin className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{creator.location}</span>
          </p>

          <PillRow className="mt-3">
            {creator.niches.slice(0, 3).map((n) => (
              <Chip key={n}>{n}</Chip>
            ))}
          </PillRow>

          {creator.gigsCompleted ? (
            <p className="mt-2.5 flex items-center gap-1 text-xs text-ink-3">
              <CheckCircle2 className="size-3.5 shrink-0 text-success" aria-hidden />
              <span className="font-semibold text-ink-2">{creator.gigsCompleted}</span> gig{creator.gigsCompleted === 1 ? "" : "s"} delivered
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-2 border-t border-line pt-3">
            <span className="text-xs text-ink-3">Starting at</span>
            <span className="font-display text-sm font-semibold text-ink sm:text-base">
              {formatNaira(creator.startingRate)}
            </span>
          </div>
        </div>
      </article>
  );

  return href ? (
    <Link href={href} className="block">
      {card}
    </Link>
  ) : (
    card
  );
}
