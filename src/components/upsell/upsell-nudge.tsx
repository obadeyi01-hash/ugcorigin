"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X, ArrowRight } from "lucide-react";

export type UpsellNudgeProps = {
  /** Unique localStorage key so each nudge is capped independently. */
  dismissKey: string;
  eyebrow?: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  /** Delay before it slides in, ms. */
  delayMs?: number;
  /** Don't show again for this many days after it was last seen/dismissed. */
  cooldownDays?: number;
  /** Stop showing after this many lifetime appearances. */
  maxShows?: number;
};

type Memo = { shows: number; lastSeen: number; done?: boolean };

const DAY = 86_400_000;

function read(key: string): Memo {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as Memo;
  } catch {
    /* ignore */
  }
  return { shows: 0, lastSeen: 0 };
}

function write(key: string, memo: Memo) {
  try {
    localStorage.setItem(key, JSON.stringify(memo));
  } catch {
    /* ignore */
  }
}

/**
 * A tasteful, dismissible, frequency-capped upsell tip. Slides in at the
 * bottom-right so it never blocks the core flow. Shows are capped per browser
 * via localStorage (both a total cap and a cooldown between appearances), and a
 * click on the CTA retires it for good. Rendered only when the surface wants it
 * (the caller decides eligibility — e.g. not already subscribed).
 */
export function UpsellNudge({
  dismissKey,
  eyebrow = "UGCOrigin",
  title,
  body,
  ctaLabel,
  ctaHref,
  delayMs = 1600,
  cooldownDays = 7,
  maxShows = 3,
}: UpsellNudgeProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const memo = read(dismissKey);
    if (memo.done || memo.shows >= maxShows) return;
    if (memo.lastSeen && Date.now() - memo.lastSeen < cooldownDays * DAY) return;
    const t = setTimeout(() => {
      setOpen(true);
      write(dismissKey, { shows: memo.shows + 1, lastSeen: Date.now(), done: memo.done });
    }, delayMs);
    return () => clearTimeout(t);
  }, [dismissKey, maxShows, cooldownDays, delayMs]);

  function close(done = false) {
    setOpen(false);
    const memo = read(dismissKey);
    write(dismissKey, { ...memo, lastSeen: Date.now(), done: done || memo.done });
  }

  if (!open) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[70] w-[calc(100vw-2rem)] max-w-sm animate-[reveal_.3s_ease-out]"
      role="dialog"
      aria-label={title}
    >
      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <button
          onClick={() => close(false)}
          aria-label="Dismiss"
          className="absolute right-3 top-3 text-ink-3 hover:text-ink"
        >
          <X className="size-4" />
        </button>
        <p className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-accent-bright px-2.5 py-0.5 text-xs font-semibold text-white">
          <Sparkles className="size-3.5" /> {eyebrow}
        </p>
        <h3 className="mt-2.5 pr-4 font-display text-base font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-sm text-ink-2">{body}</p>
        <Link
          href={ctaHref}
          onClick={() => close(true)}
          className="u-press mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-ink hover:bg-accent-hover"
        >
          {ctaLabel} <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
