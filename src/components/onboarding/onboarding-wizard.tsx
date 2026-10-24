"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { ArrowRight, ArrowLeft, Video, Store, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field, Select } from "@/components/ui/input";
import { PhoneField } from "@/components/ui/phone-field";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";
import { NICHES } from "@/lib/sample-data";
import { NG_STATES } from "@/lib/categories";
import { BRAND_GOALS, AD_PLATFORMS, CONTENT_TYPES, BUSINESS_TYPES, CONTACT_ROLES, TEAM_SIZES } from "@/lib/brand-options";
import {
  createCreatorProfile,
  createBrandProfile,
  type CreatorInput,
  type BrandInput,
} from "@/app/onboarding/actions";

type Role = "creator" | "brand" | null;

// Step ids give each screen a real URL (?step=niches) and make browser Back work.
const CREATOR_STEPS = ["basics", "niches", "rate"] as const;
const BRAND_STEPS = ["goal", "channels", "about", "details"] as const;

// How many niche pills to show before the "View more" reveal.
const PILLS_BEFORE_MORE = 14;

/**
 * Drives the current step from the URL (?role=…&step=…) so every step has its
 * own address and the browser Back button works, without a server round-trip.
 * Uses history.pushState + popstate; the step `key` also feeds the enter
 * animation.
 */
function useStepUrl(initialRole: Role) {
  const read = useCallback(() => {
    if (typeof window === "undefined") return { role: initialRole, step: null as string | null };
    const p = new URLSearchParams(window.location.search);
    const r = p.get("role");
    const role: Role = r === "brand" ? "brand" : r === "creator" ? "creator" : initialRole;
    return { role, step: p.get("step") };
  }, [initialRole]);

  const [{ role, step }, setState] = useState(read);

  useEffect(() => {
    const onPop = () => setState(read());
    window.addEventListener("popstate", onPop);
    // Sync once on mount in case the server markup and URL differ.
    setState(read());
    return () => window.removeEventListener("popstate", onPop);
  }, [read]);

  const go = useCallback((nextRole: Role, nextStep: string | null, replace = false) => {
    const p = new URLSearchParams();
    if (nextRole) p.set("role", nextRole);
    if (nextStep) p.set("step", nextStep);
    const url = `${window.location.pathname}${p.toString() ? `?${p}` : ""}`;
    if (replace) window.history.replaceState({}, "", url);
    else window.history.pushState({}, "", url);
    setState({ role: nextRole, step: nextStep });
  }, []);

  const back = useCallback(() => window.history.back(), []);

  return { role, step, go, back };
}

export function OnboardingWizard({
  initialRole = null,
  preview = false,
}: {
  initialRole?: Role;
  preview?: boolean;
}) {
  const { role, step, go, back } = useStepUrl(initialRole);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // creator fields (persist across steps; the component stays mounted)
  const [c, setC] = useState<CreatorInput>({
    firstName: "",
    lastName: "",
    displayName: "",
    location: "",
    phone: null,
    bio: "",
    niches: [],
    startingRate: 0,
  });

  // brand fields
  const [b, setB] = useState<BrandInput>({
    companyName: "", contactFirstName: "", contactLastName: "", website: "", storeUrl: "", phone: null,
    goal: "", adPlatforms: [], contentTypes: [], businessType: "", contactRole: "", teamSize: "",
  });
  const toggleIn = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  function toggleNiche(n: string) {
    setC((prev) => ({
      ...prev,
      niches: prev.niches.includes(n)
        ? prev.niches.filter((x) => x !== n)
        : prev.niches.length < 5
          ? [...prev.niches, n]
          : prev.niches,
    }));
  }

  function submitCreator() {
    setError(null);
    startTransition(async () => {
      const res = await createCreatorProfile(c);
      if (res?.error) setError(res.error);
    });
  }
  function submitBrand() {
    setError(null);
    startTransition(async () => {
      const res = await createBrandProfile(b);
      if (res?.error) setError(res.error);
    });
  }

  // ---- Role selection ----
  if (!role) {
    return (
      <Shell title="Let's set up your account" subtitle="Which best describes you?" preview={preview}>
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            { id: "creator", label: "I'm a creator", icon: Video, hint: "Make content and get hired by brands." },
            { id: "brand", label: "I'm a brand", icon: Store, hint: "Hire verified creators for your product." },
          ] as const).map((r) => (
            <button
              key={r.id}
              onClick={() => go(r.id, r.id === "creator" ? CREATOR_STEPS[0] : BRAND_STEPS[0])}
              className="u-press rounded-2xl border border-line bg-surface p-6 text-left transition-colors hover:border-accent"
            >
              <div className="grid size-11 place-items-center rounded-xl bg-accent-tint text-accent">
                <r.icon className="size-5" />
              </div>
              <p className="mt-4 font-display text-lg font-semibold text-ink">{r.label}</p>
              <p className="mt-1 text-sm text-ink-2">{r.hint}</p>
            </button>
          ))}
        </div>
      </Shell>
    );
  }

  // ---- Brand multi-step flow ----
  if (role === "brand") {
    const bstep = BRAND_STEPS.includes((step ?? "") as (typeof BRAND_STEPS)[number]) ? (step as (typeof BRAND_STEPS)[number]) : BRAND_STEPS[0];
    const bIndex = BRAND_STEPS.indexOf(bstep);
    const onBack = bIndex > 0 || !initialRole ? back : undefined;

    const Radio = ({ options, value, onPick }: { options: { value: string; label: string; hint?: string }[]; value: string; onPick: (v: string) => void }) => (
      <div className="grid gap-2.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onPick(o.value)}
            className={cn("flex items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-colors", value === o.value ? "border-accent bg-accent-tint" : "border-line bg-surface hover:border-line-strong")}
          >
            <span>
              <span className="block font-medium text-ink">{o.label}</span>
              {o.hint && <span className="block text-xs text-ink-3">{o.hint}</span>}
            </span>
            <span className={cn("size-4 shrink-0 rounded-full border", value === o.value ? "border-accent bg-accent" : "border-line")} />
          </button>
        ))}
      </div>
    );
    const Multi = ({ options, values, onToggle }: { options: { value: string; label: string }[]; values: string[]; onToggle: (v: string) => void }) => (
      <div className="grid gap-2.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onToggle(o.value)}
            className={cn("flex items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-colors", values.includes(o.value) ? "border-accent bg-accent-tint" : "border-line bg-surface hover:border-line-strong")}
          >
            <span className="font-medium text-ink">{o.label}</span>
            <span className={cn("grid size-4 shrink-0 place-items-center rounded border", values.includes(o.value) ? "border-accent bg-accent text-accent-ink" : "border-line")}>
              {values.includes(o.value) && <Check className="size-3" />}
            </span>
          </button>
        ))}
      </div>
    );

    return (
      <Shell
        title={BRAND_TITLES[bstep].title}
        subtitle={BRAND_TITLES[bstep].subtitle}
        preview={preview}
        onBack={onBack}
        totalSteps={BRAND_STEPS.length}
        currentStep={bIndex + 1}
        animKey={`b-${bstep}`}
      >
        {bstep === "goal" && (
          <>
            <Radio options={BRAND_GOALS} value={b.goal} onPick={(goal) => setB({ ...b, goal })} />
            <div className="mt-5 flex justify-end">
              <Button onClick={() => go("brand", "channels")} disabled={!b.goal}>Continue <ArrowRight className="size-4" /></Button>
            </div>
          </>
        )}
        {bstep === "channels" && (
          <>
            <p className="mb-2 text-sm font-medium text-ink">Ad platforms</p>
            <Multi options={AD_PLATFORMS} values={b.adPlatforms} onToggle={(v) => setB({ ...b, adPlatforms: toggleIn(b.adPlatforms, v) })} />
            <p className="mb-2 mt-5 text-sm font-medium text-ink">Content you need</p>
            <Multi options={CONTENT_TYPES} values={b.contentTypes} onToggle={(v) => setB({ ...b, contentTypes: toggleIn(b.contentTypes, v) })} />
            <div className="mt-5 flex justify-end">
              <Button onClick={() => go("brand", "about")}>Continue <ArrowRight className="size-4" /></Button>
            </div>
          </>
        )}
        {bstep === "about" && (
          <>
            <p className="mb-2 text-sm font-medium text-ink">What kind of business?</p>
            <Radio options={BUSINESS_TYPES} value={b.businessType} onPick={(businessType) => setB({ ...b, businessType })} />
            <p className="mb-2 mt-5 text-sm font-medium text-ink">Your role</p>
            <Radio options={CONTACT_ROLES} value={b.contactRole} onPick={(contactRole) => setB({ ...b, contactRole })} />
            <p className="mb-2 mt-5 text-sm font-medium text-ink">Team size</p>
            <Radio options={TEAM_SIZES} value={b.teamSize} onPick={(teamSize) => setB({ ...b, teamSize })} />
            <div className="mt-5 flex justify-end">
              <Button onClick={() => go("brand", "details")}>Continue <ArrowRight className="size-4" /></Button>
            </div>
          </>
        )}
        {bstep === "details" && (
          <div className="grid gap-4">
            <Field label="Company / store name">
              <Input value={b.companyName} onChange={(e) => setB({ ...b, companyName: e.target.value })} placeholder="e.g. Zuri Skincare" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact first name" hint="Optional">
                <Input value={b.contactFirstName} onChange={(e) => setB({ ...b, contactFirstName: e.target.value })} placeholder="Chidi" />
              </Field>
              <Field label="Contact last name" hint="Optional">
                <Input value={b.contactLastName} onChange={(e) => setB({ ...b, contactLastName: e.target.value })} placeholder="Okafor" />
              </Field>
            </div>
            <Field label="Website" hint="Optional">
              <Input value={b.website} onChange={(e) => setB({ ...b, website: e.target.value })} placeholder="https://" />
            </Field>
            <Field label="Online store" hint="Optional, Shopify, Instagram shop, etc.">
              <Input value={b.storeUrl} onChange={(e) => setB({ ...b, storeUrl: e.target.value })} placeholder="https://" />
            </Field>
            <Field label="Phone number" hint="For booking coordination. Shared with a creator only after you agree on a gig.">
              <PhoneField value={b.phone} onChange={(phone) => setB({ ...b, phone })} />
            </Field>
            {error && <p className="text-sm text-error">{error}</p>}
            <Button onClick={submitBrand} loading={pending} disabled={!b.companyName.trim()}>
              Create brand account <ArrowRight className="size-4" />
            </Button>
          </div>
        )}
      </Shell>
    );
  }

  // ---- Creator wizard ----
  const cstep = CREATOR_STEPS.includes((step ?? "") as (typeof CREATOR_STEPS)[number]) ? (step as (typeof CREATOR_STEPS)[number]) : CREATOR_STEPS[0];
  const cIndex = CREATOR_STEPS.indexOf(cstep);

  const canNext1 = !!c.firstName.trim() && !!c.location.trim();
  const canNext2 = c.niches.length > 0;
  const canSubmit = c.startingRate > 0;

  return (
    <Shell
      title={CREATOR_TITLES[cstep].title}
      subtitle={CREATOR_TITLES[cstep].subtitle}
      preview={preview}
      onBack={cIndex > 0 || !initialRole ? back : undefined}
      totalSteps={CREATOR_STEPS.length}
      currentStep={cIndex + 1}
      animKey={`c-${cstep}`}
    >
      {cstep === "basics" && (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name">
              <Input value={c.firstName} onChange={(e) => setC({ ...c, firstName: e.target.value })} placeholder="Amara" />
            </Field>
            <Field label="Last name" hint="Shown publicly as initial only">
              <Input value={c.lastName} onChange={(e) => setC({ ...c, lastName: e.target.value })} placeholder="Obi" />
            </Field>
          </div>
          <p className="-mt-1 text-xs text-ink-3">
            Brands see &ldquo;{c.firstName.trim() || "First"} {c.lastName.trim() ? c.lastName.trim()[0].toUpperCase() + "." : "L."}&rdquo; until you both agree on a booking, then your full name unlocks. We&apos;ll set up your @handle for you — you can change it later in settings.
          </p>
          <Field label="Location" hint="Where you're based in Nigeria.">
            <Select value={c.location} onChange={(e) => setC({ ...c, location: e.target.value })}>
              <option value="">Select your state</option>
              {NG_STATES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
          </Field>
          <Field label="Phone number" hint="For booking coordination. Hidden until you both agree on a gig.">
            <PhoneField value={c.phone} onChange={(phone) => setC({ ...c, phone })} />
          </Field>
          <Button onClick={() => go("creator", "niches")} disabled={!canNext1}>
            Continue <ArrowRight className="size-4" />
          </Button>
        </div>
      )}

      {cstep === "niches" && (
        <div className="grid gap-4">
          <Field label="Your niches" hint="Pick up to 5, what you make best.">
            <NichePicker selected={c.niches} onToggle={toggleNiche} />
          </Field>
          <Button onClick={() => go("creator", "rate")} disabled={!canNext2}>
            Continue <ArrowRight className="size-4" />
          </Button>
        </div>
      )}

      {cstep === "rate" && (
        <div className="grid gap-4">
          <Field label="Starting rate (₦)" hint="Your lowest package price. You can add more packages later.">
            <Input
              type="number"
              inputMode="numeric"
              value={c.startingRate || ""}
              onChange={(e) => setC({ ...c, startingRate: Number(e.target.value) })}
              placeholder="e.g. 45000"
            />
          </Field>
          <Field label="Short bio" hint="Optional, a line about your content.">
            <Textarea value={c.bio} onChange={(e) => setC({ ...c, bio: e.target.value })} placeholder="I make authentic skincare testimonials and unboxings." />
          </Field>
          {error && <p className="text-sm text-error">{error}</p>}
          <Button onClick={submitCreator} loading={pending} disabled={!canSubmit}>
            Create my profile <Check className="size-4" />
          </Button>
          <p className="text-xs text-ink-3">
            Next, you&apos;ll verify your identity and bank details to go live and get hired.
          </p>
        </div>
      )}
    </Shell>
  );
}

const CREATOR_TITLES: Record<(typeof CREATOR_STEPS)[number], { title: string; subtitle: string }> = {
  basics: { title: "Set up your creator profile", subtitle: "Start with the basics." },
  niches: { title: "What do you make?", subtitle: "Pick the niches you're strongest in." },
  rate: { title: "Your starting rate", subtitle: "Almost done." },
};
const BRAND_TITLES: Record<(typeof BRAND_STEPS)[number], { title: string; subtitle: string }> = {
  goal: { title: "What are you trying to do?", subtitle: "Most brands use more than one. Pick your main focus." },
  channels: { title: "Where do your ads run?", subtitle: "And what content do you need? Select all that apply." },
  about: { title: "Tell us about you", subtitle: "So we can tailor your recommendations." },
  details: { title: "Your brand details", subtitle: "This is what creators see when you reach out." },
};

/** Niche pills with a "View more" reveal: the common ones first, the long tail
 *  behind a control so the first screen stays scannable. */
function NichePicker({ selected, onToggle }: { selected: string[]; onToggle: (n: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  // Keep any already-selected pill from the long tail visible even when collapsed.
  const head = NICHES.slice(0, PILLS_BEFORE_MORE);
  const tail = NICHES.slice(PILLS_BEFORE_MORE);
  const visible = expanded ? NICHES : [...head, ...tail.filter((n) => selected.includes(n))];
  const hiddenCount = NICHES.length - visible.length;

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((n) => (
        <button key={n} type="button" onClick={() => onToggle(n)}>
          <Chip active={selected.includes(n)}>{n}</Chip>
        </button>
      ))}
      {!expanded && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="u-press inline-flex items-center gap-1 rounded-full border border-dashed border-line px-3 py-1 text-xs font-medium text-ink-2 transition-colors hover:border-accent hover:text-accent"
        >
          <Plus className="size-3" /> View more ({hiddenCount})
        </button>
      )}
    </div>
  );
}

function Shell({
  title,
  subtitle,
  children,
  onBack,
  totalSteps,
  currentStep,
  preview,
  animKey,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  totalSteps?: number;
  currentStep?: number;
  preview?: boolean;
  animKey?: string;
}) {
  const showProgress = totalSteps !== undefined && currentStep !== undefined;
  return (
    <div className="w-full max-w-md">
      {preview && (
        <div className="mb-5 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs text-ink-2">
          Preview, connect Supabase to save profiles.
        </div>
      )}
      {onBack && (
        <button onClick={onBack} className="mb-4 inline-flex items-center gap-1 text-sm text-ink-2 transition-colors hover:text-ink">
          <ArrowLeft className="size-4" /> Back
        </button>
      )}
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{title}</h1>
      {subtitle && <p className="mt-1.5 text-sm text-ink-2">{subtitle}</p>}
      {showProgress && (
        <div className="mt-4">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors duration-300",
                  i < currentStep ? "bg-accent" : "bg-surface-2",
                )}
              />
            ))}
          </div>
          <p className="mt-2 text-xs font-medium text-ink-3">Step {currentStep} of {totalSteps}</p>
        </div>
      )}
      <div key={animKey} className="mt-6 animate-reveal">{children}</div>
    </div>
  );
}
