"use client";

import Image from "next/image";
import { useState } from "react";
import type { ComponentType } from "react";
import { Play, Check, Lock, Clock, ShieldCheck, Banknote, RotateCcw } from "lucide-react";

// The headline "product moment" — a standalone, full-width horizontal card that
// tells the review → approve → release story with real copy and one live, tasteful
// interaction (approve & release). Illustrative markup in human context, not a
// screenshot and not a claimed metric — same spirit as the WorkspaceStill tile.
//
// One component, two framings of the *same* moment: the brand's side (review →
// approve → release) on the homepage + /for-brands, and the creator's side
// (deliver → approved → paid) on /for-creators. Default stays "brand" so the
// homepage keeps its exact copy.

const DRAFT_IMAGE =
  "https://images.pexels.com/photos/1757281/pexels-photo-1757281.jpeg?auto=compress&cs=tinysrgb&w=900&h=1100&fit=crop";

const ticks: { icon: ComponentType<{ className?: string }>; label: string }[] = [
  { icon: Clock, label: "Time-stamped notes" },
  { icon: ShieldCheck, label: "Escrow-backed" },
  { icon: Banknote, label: "Paid next day" },
];

export type ProductMomentVariant = "brand" | "creator";

type Copy = {
  eyebrow: string;
  title: string;
  body: string;
  draftBadge: string;
  avatar: string;
  escrowIdle: string;
  escrowReleased: string;
  nameIdle: string;
  nameReleased: string;
  subIdle: string;
  subReleased: string;
  buttonIdle: string;
  buttonReleased: string;
  srIdle: string;
  srReleased: string;
};

const COPY: Record<ProductMomentVariant, Copy> = {
  brand: {
    eyebrow: "The review moment",
    title: "See it, note it, approve it — then they get paid",
    body:
      "A creator's draft lands here, not in your DMs. Scrub the video, drop notes on the exact frame, and ask for the tweak you need. The money's already held safely in escrow — the moment you approve, the final files unlock and payment settles to the creator's bank.",
    draftBadge: "0:30 draft · @amaka",
    avatar: "A",
    escrowIdle: "Held in escrow",
    escrowReleased: "Released from escrow",
    nameIdle: "Funded for @amaka",
    nameReleased: "Paid to @amaka",
    subIdle: "Released when you approve",
    subReleased: "Settles to their bank next day",
    buttonIdle: "Approve & release payment",
    buttonReleased: "Approved & released",
    srIdle: "Payment held in escrow.",
    srReleased: "Payment released to the creator.",
  },
  creator: {
    eyebrow: "The payout moment",
    title: "Deliver, get approved — get paid the next day",
    body:
      "Your draft lands in the shared workspace, not someone's DMs. The brand scrubs the video and drops notes on the exact frame — and the money's already held safely in escrow before you start. The moment they approve, your final files unlock and your payout settles to your bank. You keep 100%.",
    draftBadge: "0:30 draft · your upload",
    avatar: "L",
    escrowIdle: "Held in escrow for you",
    escrowReleased: "Payout released to you",
    nameIdle: "Funded by Lola, brand",
    nameReleased: "Paid to you",
    subIdle: "Yours the moment they approve",
    subReleased: "Next-day payout to your bank",
    buttonIdle: "Approve & release",
    buttonReleased: "Payout released — you're paid",
    srIdle: "Payment held in escrow, awaiting the brand's approval.",
    srReleased: "Payout released to you.",
  },
};

export function ProductMomentFeature({ variant = "brand" }: { variant?: ProductMomentVariant } = {}) {
  const [released, setReleased] = useState(false);
  const c = COPY[variant];

  return (
    <div className="group/card overflow-hidden rounded-3xl border border-line bg-surface shadow-sm transition-shadow duration-300 hover:shadow-lg">
      <div className="grid md:grid-cols-[1fr_1.05fr]">
        {/* Media — the creator's draft in review */}
        <div className="u-zoom group relative aspect-[16/11] overflow-hidden bg-surface-2 md:aspect-auto md:min-h-[24rem]">
          <Image
            src={DRAFT_IMAGE}
            alt="A creator's draft in review on UGCOrigin"
            fill
            sizes="(max-width: 768px) 100vw, 480px"
            data-zoom
            className="object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-obsidian/45 via-transparent to-obsidian/15" />

          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-obsidian/70 px-2.5 py-1 text-2xs font-medium text-chalk backdrop-blur-sm">
            <Play className="size-3 fill-current" /> {c.draftBadge}
          </span>

          {/* time-stamped feedback bubble (the real workspace feature) */}
          <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-surface/95 p-3 shadow-md backdrop-blur-sm">
            <p className="text-2xs font-semibold text-accent-hover">0:12 · Lola, brand</p>
            <p className="mt-0.5 text-sm leading-snug text-ink">Love this hook 🔥 hold it one beat longer before the reveal?</p>
          </div>
        </div>

        {/* Copy + the live approve/release moment */}
        <div className="p-6 sm:p-8 lg:p-10">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-hover">{c.eyebrow}</span>
          <h3 className="mt-2 text-balance font-display text-2xl font-semibold text-ink sm:text-3xl">
            {c.title}
          </h3>
          <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-ink-2 sm:text-base">
            {c.body}
          </p>

          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
            {ticks.map((t) => (
              <li key={t.label} className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-2">
                <t.icon className="size-4 text-accent" aria-hidden /> {t.label}
              </li>
            ))}
          </ul>

          {/* Live escrow panel */}
          <div className="mt-6 rounded-2xl border border-line bg-paper p-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-2xs font-semibold text-ink-2">
                {released ? <Check className="size-3.5 text-success" /> : <Lock className="size-3.5 text-accent" />}
                {released ? c.escrowReleased : c.escrowIdle}
              </span>
              <span className="text-2xs font-medium text-ink-3">Paystack</span>
            </div>

            <div className="mt-2 flex items-end justify-between gap-3">
              <p className="font-display text-2xl font-bold text-ink">₦45,000</p>
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-full bg-accent-tint text-xs font-bold text-accent-hover">{c.avatar}</span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-ink">
                    {released ? c.nameReleased : c.nameIdle}
                  </p>
                  <p className="text-2xs text-ink-3">{released ? c.subReleased : c.subIdle}</p>
                </div>
              </div>
            </div>

            {released ? (
              <button
                type="button"
                onClick={() => setReleased(false)}
                className="u-press mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-success/30 bg-success/10 px-4 py-2.5 text-sm font-semibold text-success transition-colors"
              >
                <Check className="size-4" /> {c.buttonReleased}
                <RotateCcw className="ml-1 size-3.5 opacity-60" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setReleased(true)}
                className="u-press mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink shadow-sm transition-colors hover:bg-accent-hover"
              >
                <Check className="size-4" /> {c.buttonIdle}
              </button>
            )}
            <p aria-live="polite" className="sr-only">
              {released ? c.srReleased : c.srIdle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
