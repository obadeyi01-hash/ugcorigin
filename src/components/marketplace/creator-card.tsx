import Image from "next/image";
import Link from "next/link";
import { MapPin, CheckCircle2 } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { PillRow } from "@/components/ui/pill-row";
import { Rating } from "@/components/ui/rating";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { formatNaira } from "@/lib/utils";

export type Creator = {
  name: string;
  handle?: string;
  image?: string;
  location: string;
  niches: string[];
  startingRate: number;
  featured?: boolean;
  verified?: boolean;
  /** Server-truth only, rendered when real data exists. Never fabricated. */
  rating?: number;
  reviews?: number;
  gigsCompleted?: number;
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
            <div className="absolute right-3 top-3">
              <Rating value={creator.rating} count={creator.reviews} className="rounded-full bg-chalk/95 px-2.5 py-1 shadow-sm backdrop-blur" />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-display font-semibold text-ink">{creator.name}</h3>
            {creator.verified && <VerifiedBadge compact />}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-3">
            <MapPin className="size-3" aria-hidden />
            {creator.location}
          </p>

          <PillRow className="mt-3">
            {creator.niches.slice(0, 3).map((n) => (
              <Chip key={n}>{n}</Chip>
            ))}
          </PillRow>

          {creator.gigsCompleted ? (
            <p className="mt-2.5 flex items-center gap-1 text-xs text-ink-3">
              <CheckCircle2 className="size-3.5 text-success" aria-hidden />
              <span className="font-semibold text-ink-2">{creator.gigsCompleted}</span> gig{creator.gigsCompleted === 1 ? "" : "s"} delivered
            </p>
          ) : null}

          <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
            <span className="text-xs text-ink-3">Starting at</span>
            <span className="font-display text-base font-semibold text-ink">
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
