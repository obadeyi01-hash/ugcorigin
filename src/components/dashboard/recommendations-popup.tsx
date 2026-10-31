"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X, ArrowRight, ArrowLeft, ChevronRight, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/utils";

export type RecCreator = {
  handle: string;
  name: string;
  niches: string[];
  startingRate: number;
  newbie?: boolean;
  image?: string | null;
  location?: string | null;
  bio?: string | null;
  tier?: string | null;
};

function initialsOf(name: string) {
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Avatar that shows the creator photo, falling back to initials if there is
 * none or it fails to load (so a broken image never leaves an empty circle). */
function Avatar({ src, name, className }: { src?: string | null; name: string; className: string }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} onError={() => setFailed(true)} className={`${className} rounded-full object-cover`} />;
  }
  return (
    <span className={`${className} grid place-items-center rounded-full bg-accent-tint font-display font-bold text-accent`}>
      {initialsOf(name)}
    </span>
  );
}

/**
 * One-time (per brand, per browser) popup of up to 5 creator recommendations.
 * A brand can scan the list, open any one for a closer look in place, page
 * between them, and only leave the modal when they choose a full profile.
 */
export function RecommendationsPopup({ creators }: { creators: RecCreator[] }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState<number | null>(null); // null = list, else detail
  const KEY = "ugc:brand-recs-seen";

  useEffect(() => {
    try {
      if (creators.length > 0 && localStorage.getItem(KEY) !== "1") setOpen(true);
    } catch {
      /* ignore */
    }
  }, [creators.length]);

  function close() {
    setOpen(false);
    setIdx(null);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
  }

  if (!open) return null;
  const detail = idx !== null ? creators[idx] : null;

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-obsidian/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={close}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-line p-5 sm:p-6">
          {detail ? (
            <button
              onClick={() => setIdx(null)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-accent"
            >
              <ArrowLeft className="size-4" /> All recommendations
            </button>
          ) : (
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-accent-bright px-2.5 py-0.5 text-xs font-semibold text-white">
                <Sparkles className="size-3.5" /> Recommended for you
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold text-ink">Creators to get you started</h2>
              <p className="mt-0.5 text-sm text-ink-2">A mix of top talent and newly-vetted creators you can try at a lower cost.</p>
            </div>
          )}
          <button onClick={close} aria-label="Close" className="shrink-0 text-ink-3 hover:text-ink"><X className="size-5" /></button>
        </div>

        {/* Body scrolls on small screens */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          {detail ? (
            <div>
              <div className="flex items-center gap-4">
                <Avatar src={detail.image} name={detail.name} className="size-20 shrink-0 text-xl" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="font-display text-lg font-semibold text-ink">{detail.name}</h3>
                    {detail.newbie && <span className="rounded-full bg-success/14 px-1.5 py-0.5 text-2xs font-semibold text-success">New</span>}
                    {detail.tier && <span className="rounded-full bg-accent-tint px-2 py-0.5 text-2xs font-semibold text-accent">{cap(detail.tier)}</span>}
                  </div>
                  {detail.location && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-ink-3"><MapPin className="size-3" /> {detail.location}</p>
                  )}
                  <p className="mt-1 text-sm font-semibold text-ink">From {detail.startingRate ? formatNaira(detail.startingRate) : "—"}</p>
                </div>
              </div>

              {detail.niches.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {detail.niches.slice(0, 6).map((n) => (
                    <span key={n} className="rounded-full border border-line bg-paper px-2.5 py-0.5 text-xs text-ink-2">{n}</span>
                  ))}
                </div>
              )}

              {detail.bio && <p className="mt-4 text-sm leading-relaxed text-ink-2">{detail.bio}</p>}

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Link href={`/${detail.handle}`} onClick={close} className="sm:flex-1">
                  <Button className="w-full">View full profile <ExternalLink className="size-4" /></Button>
                </Link>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setIdx((i) => (i! > 0 ? i! - 1 : i))} disabled={idx === 0} className="flex-1 sm:flex-none">
                    <ArrowLeft className="size-4" /> Prev
                  </Button>
                  <Button variant="secondary" onClick={() => setIdx((i) => (i! < creators.length - 1 ? i! + 1 : i))} disabled={idx === creators.length - 1} className="flex-1 sm:flex-none">
                    Next <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {creators.map((c, i) => (
                <li key={c.handle}>
                  <button
                    onClick={() => setIdx(i)}
                    className="u-lift flex w-full items-center gap-3 rounded-xl border border-line bg-paper p-3 text-left transition-colors hover:border-accent/40"
                  >
                    <Avatar src={c.image} name={c.name} className="size-11 shrink-0 text-sm" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate font-medium text-ink">{c.name}</span>
                        {c.newbie && <span className="rounded-full bg-success/14 px-1.5 py-0.5 text-2xs font-semibold text-success">New</span>}
                        {c.tier && <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-2xs font-medium text-ink-2">{cap(c.tier)}</span>}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-ink-3">
                        {c.location ? `${c.location} · ` : ""}{c.niches.slice(0, 2).join(" · ")}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1">
                      {c.startingRate ? <span className="text-sm font-semibold text-ink">{formatNaira(c.startingRate)}</span> : null}
                      <ChevronRight className="size-4 text-ink-3" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer only on the list */}
        {!detail && (
          <div className="border-t border-line p-4 sm:px-6">
            <Link href="/creators" onClick={close} className="block">
              <Button className="w-full">Browse all creators <ArrowRight className="size-4" /></Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
