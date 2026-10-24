import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

// "Shop by category" — human category cards. Each tile is a soft pastel panel
// (locked palette: peach / lavender / mint / accent-tint) framing a real
// Nigerian creator, labelled with a UGC niche that links into the directory.
// Imagery reuses the vetted, model-released Pexels portraits from sample-data.
// No fabricated metrics — the only promise is "browse".

const img = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop`;

type Tile = { label: string; niche: string; image: number; tint: string };

// `niche` must match a value in CATEGORIES so the /creators filter resolves.
const TILES: Tile[] = [
  { label: "Beauty & Skincare", niche: "Beauty & Skincare", image: 1757281, tint: "bg-peach" },
  { label: "Fashion", niche: "Fashion", image: 12447951, tint: "bg-lavender" },
  { label: "Food & Cooking", niche: "Food & Cooking", image: 13417077, tint: "bg-mint" },
  { label: "Finance & Fintech", niche: "Finance & Fintech", image: 10375901, tint: "bg-accent-tint" },
  { label: "Skits", niche: "Skits", image: 15135912, tint: "bg-peach" },
  { label: "SaaS / Tech", niche: "SaaS / Tech", image: 15689960, tint: "bg-lavender" },
];

function CategoryTile({ tile, priority = false }: { tile: Tile; priority?: boolean }) {
  return (
    <Link
      href={`/creators?niche=${encodeURIComponent(tile.niche)}`}
      className={cn(
        "group u-card u-zoom block overflow-hidden rounded-2xl border border-line/50 p-1.5 shadow-xs",
        tile.tint,
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-surface-2">
        <Image
          src={img(tile.image)}
          alt={`${tile.label} creators on UGCOrigin`}
          fill
          sizes="(max-width: 640px) 42vw, (max-width: 1024px) 22vw, 200px"
          priority={priority}
          data-zoom
          className="object-cover"
        />
      </div>
      <div className="flex items-center justify-between gap-1 px-1.5 py-2">
        <span className="min-w-0 truncate font-display text-xs font-semibold text-ink sm:text-sm">{tile.label}</span>
        <ArrowUpRight className="size-3.5 shrink-0 text-ink-2 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
      </div>
    </Link>
  );
}

export function CategoryTiles({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        // Mobile: snap scroller with small, peeking tiles (more per view).
        "-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 scroll-smooth overscroll-x-contain",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "[&>*]:w-[42%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-auto",
        // sm+: a tidy grid.
        "sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-6",
        className,
      )}
    >
      {TILES.map((t, i) => (
        <CategoryTile key={t.label} tile={t} priority={i < 3} />
      ))}
    </div>
  );
}
