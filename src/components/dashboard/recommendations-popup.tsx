"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/utils";

export type RecCreator = {
  handle: string;
  name: string;
  niches: string[];
  startingRate: number;
  newbie?: boolean;
};

/**
 * One-time (per brand, per browser) popup of up to 5 creator recommendations —
 * a mix of top performers and newly-vetted creators to try at a lower cost.
 */
export function RecommendationsPopup({ creators }: { creators: RecCreator[] }) {
  const [open, setOpen] = useState(false);
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
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-obsidian/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-[#a855f7] px-2.5 py-0.5 text-xs font-semibold text-white">
              <Sparkles className="size-3.5" /> Recommended for you
            </p>
            <h2 className="mt-2 font-display text-xl font-semibold text-ink">Creators to get you started</h2>
            <p className="mt-0.5 text-sm text-ink-2">A mix of top talent and newly-vetted creators you can try at a lower cost.</p>
          </div>
          <button onClick={close} aria-label="Close" className="text-ink-3 hover:text-ink"><X className="size-5" /></button>
        </div>

        <ul className="mt-4 space-y-2">
          {creators.map((c) => (
            <li key={c.handle}>
              <Link
                href={`/${c.handle}`}
                onClick={close}
                className="u-lift flex items-center gap-3 rounded-xl border border-line bg-paper p-3"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-tint font-display font-bold text-accent">
                  {c.name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate font-medium text-ink">{c.name}</span>
                    {c.newbie && <span className="rounded-full bg-success/14 px-1.5 py-0.5 text-[10px] font-semibold text-success">New</span>}
                  </span>
                  <span className="block truncate text-xs text-ink-3">{c.niches.slice(0, 2).join(" · ")}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-ink">{c.startingRate ? formatNaira(c.startingRate) : ""}</span>
              </Link>
            </li>
          ))}
        </ul>

        <Link href="/creators" onClick={close} className="mt-4 block">
          <Button className="w-full">Browse all creators <ArrowRight className="size-4" /></Button>
        </Link>
      </div>
    </div>
  );
}
