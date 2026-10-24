import Image from "next/image";
import type { ComponentType } from "react";
import { Play, Check, X, Lock, Sparkles } from "lucide-react";

// Phase 2 — "product moment in human context". These are illustrative product
// surfaces (like the sample creator strip): styled markup, not screenshots, and
// not claimed metrics. They show UGCOrigin working ON a real creator's content
// so the product stays warm and human, never a cold SaaS demo.

const still = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800&h=1000&fit=crop`;

/** The review → approve moment: a creator's draft with a time-stamped note and
 *  the approve/release bar. The emotional payoff of the whole flow. */
export function WorkspaceStill({ priority = false, rounded = "rounded-2xl" }: { priority?: boolean; rounded?: string }) {
  return (
    <div className={`relative aspect-[4/5] w-full overflow-hidden ${rounded} bg-surface-2`}>
      <Image
        src={still(1757281)}
        alt="A creator's draft in review on UGCOrigin"
        fill
        sizes="(max-width: 640px) 80vw, 340px"
        priority={priority}
        className="object-cover"
      />
      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-obsidian/70 px-2 py-1 text-2xs font-medium text-chalk backdrop-blur-sm">
        <Play className="size-3 fill-current" /> 0:30 draft
      </span>
      {/* time-stamped feedback bubble (the real gig-workspace feature) */}
      <div className="absolute inset-x-3 bottom-[4.25rem] rounded-xl bg-surface/95 p-2.5 shadow-md backdrop-blur-sm">
        <p className="text-2xs font-semibold text-accent-hover">0:12 · Lola, brand</p>
        <p className="mt-0.5 text-xs leading-snug text-ink">Love this hook 🔥 hold it one beat longer?</p>
      </div>
      <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-xl bg-obsidian/85 px-2.5 py-1.5 backdrop-blur-sm">
        <span className="whitespace-nowrap text-2xs font-medium text-chalk/80">₦45,000</span>
        <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-accent px-2.5 py-1 text-2xs font-semibold text-accent-ink">
          <Check className="size-3 shrink-0" /> Approve
        </span>
      </div>
    </div>
  );
}

/** Hero strip tile — the product moment, sized to sit beside the creator faces. */
export function ProductMomentCard() {
  return (
    <div className="u-lift overflow-hidden rounded-2xl border border-chalk/10 bg-surface p-2.5 shadow-lg">
      <WorkspaceStill priority />
      <p className="px-1 pb-0.5 pt-2 text-2xs font-medium text-ink-3">
        Review on-platform · pay only when approved
      </p>
    </div>
  );
}

/** Mini brief-wizard surface (step 1) — real brief language, human + local. */
function BriefMock() {
  return (
    <div className="rounded-2xl border border-line bg-paper p-3.5">
      <p className="text-2xs font-semibold uppercase tracking-wide text-ink-3">New brief</p>
      <p className="mt-1 font-display text-sm font-semibold text-ink">Skincare unboxing, honest first try</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {["30s", "TikTok", "Vertical", "Unboxing"].map((t) => (
          <span key={t} className="inline-flex items-center rounded-full bg-surface px-2.5 py-1 text-2xs font-medium leading-none text-ink-2 shadow-xs">{t}</span>
        ))}
      </div>
      <div className="mt-3 space-y-1.5">
        <p className="flex items-center gap-1.5 text-2xs text-ink-2"><Check className="size-3.5 shrink-0 text-success" /><span>Show the texture on skin</span></p>
        <p className="flex items-center gap-1.5 text-2xs text-ink-3"><X className="size-3.5 shrink-0 text-ink-3" /><span>No heavy filters</span></p>
      </div>
    </div>
  );
}

/** Escrow-funding surface (step 2) — money held, Paystack, funded for a person. */
function EscrowMock() {
  return (
    <div className="rounded-2xl border border-line bg-paper p-3.5">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-2xs font-semibold text-ink-2"><Lock className="size-3.5 text-accent" /> Held in escrow</span>
        <span className="text-2xs font-medium text-ink-3">Paystack</span>
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-ink">₦45,000</p>
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-surface p-2 shadow-xs">
        <span className="grid size-7 place-items-center rounded-full bg-accent-tint text-xs font-bold text-accent-hover">A</span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-ink">Funded for @amaka</p>
          <p className="text-2xs text-ink-3">Released when you approve</p>
        </div>
      </div>
    </div>
  );
}

type Step = { icon: ComponentType<{ className?: string }>; title: string; body: string };

function TileHeader({ index, icon: Icon, title }: { index: number; icon: Step["icon"]; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-tint px-2 py-0.5 text-2xs font-bold text-accent-hover">
        <Icon className="size-3" /> 0{index}
      </span>
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
    </div>
  );
}

/** "How it works" as an asymmetric bento of product surfaces in human context,
 *  replacing the three equal icon cards. Same copy + 1-2-3 hierarchy. */
export function HowItWorks({ steps }: { steps: Step[] }) {
  return (
    <div className="mt-12 grid gap-5 md:grid-cols-2">
      <div className="u-lift rounded-3xl border border-line bg-surface p-6 shadow-sm">
        <TileHeader index={1} icon={steps[0].icon} title={steps[0].title} />
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{steps[0].body}</p>
        <div className="mt-4"><BriefMock /></div>
      </div>

      <div className="u-lift rounded-3xl border border-line bg-surface p-6 shadow-sm">
        <TileHeader index={2} icon={steps[1].icon} title={steps[1].title} />
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{steps[1].body}</p>
        <div className="mt-4"><EscrowMock /></div>
      </div>

      {/* Step 3 — the payoff, full width, product + copy side by side. */}
      <div className="u-lift rounded-3xl border border-accent/15 bg-accent-tint/40 p-6 shadow-sm md:col-span-2">
        <div className="grid items-center gap-6 sm:grid-cols-[1fr_15rem]">
          <div>
            <TileHeader index={3} icon={steps[2].icon} title={steps[2].title} />
            <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-2">{steps[2].body}</p>
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-accent-hover">
              <Sparkles className="size-3.5" /> Time-stamped notes, right on the video
            </p>
          </div>
          <div className="mx-auto w-[14rem] max-w-full sm:w-full"><WorkspaceStill /></div>
        </div>
      </div>
    </div>
  );
}
