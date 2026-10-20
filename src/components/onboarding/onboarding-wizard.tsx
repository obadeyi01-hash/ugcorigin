"use client";

import { useState, useTransition } from "react";
import { ArrowRight, ArrowLeft, Video, Store, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PillRow } from "@/components/ui/pill-row";
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

export function OnboardingWizard({
  initialRole = null,
  preview = false,
}: {
  initialRole?: Role;
  preview?: boolean;
}) {
  const [role, setRole] = useState<Role>(initialRole);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // creator fields
  const [c, setC] = useState<CreatorInput>({
    handle: "",
    firstName: "",
    lastName: "",
    displayName: "",
    location: "",
    phone: null,
    bio: "",
    niches: [],
    startingRate: 0,
  });
  const [step, setStep] = useState(1);

  // brand fields
  const [b, setB] = useState<BrandInput>({
    companyName: "", contactFirstName: "", contactLastName: "", website: "", storeUrl: "", phone: null,
    goal: "", adPlatforms: [], contentTypes: [], businessType: "", contactRole: "", teamSize: "",
  });
  const [bstep, setBstep] = useState(1);
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
              onClick={() => setRole(r.id)}
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

    if (bstep === 1)
      return (
        <Shell title="What are you trying to do?" subtitle="Most brands use more than one. Pick your main focus." preview={preview} onBack={() => setRole(initialRole ? role : null)}>
          <Radio options={BRAND_GOALS} value={b.goal} onPick={(goal) => setB({ ...b, goal })} />
          <div className="mt-5 flex justify-end">
            <Button onClick={() => setBstep(2)} disabled={!b.goal}>Continue <ArrowRight className="size-4" /></Button>
          </div>
        </Shell>
      );
    if (bstep === 2)
      return (
        <Shell title="Where do your ads run?" subtitle="And what content do you need? Select all that apply." preview={preview} onBack={() => setBstep(1)}>
          <p className="mb-2 text-sm font-medium text-ink">Ad platforms</p>
          <Multi options={AD_PLATFORMS} values={b.adPlatforms} onToggle={(v) => setB({ ...b, adPlatforms: toggleIn(b.adPlatforms, v) })} />
          <p className="mb-2 mt-5 text-sm font-medium text-ink">Content you need</p>
          <Multi options={CONTENT_TYPES} values={b.contentTypes} onToggle={(v) => setB({ ...b, contentTypes: toggleIn(b.contentTypes, v) })} />
          <div className="mt-5 flex justify-end">
            <Button onClick={() => setBstep(3)}>Continue <ArrowRight className="size-4" /></Button>
          </div>
        </Shell>
      );
    if (bstep === 3)
      return (
        <Shell title="Tell us about you" subtitle="So we can tailor your recommendations." preview={preview} onBack={() => setBstep(2)}>
          <p className="mb-2 text-sm font-medium text-ink">What kind of business?</p>
          <Radio options={BUSINESS_TYPES} value={b.businessType} onPick={(businessType) => setB({ ...b, businessType })} />
          <p className="mb-2 mt-5 text-sm font-medium text-ink">Your role</p>
          <Radio options={CONTACT_ROLES} value={b.contactRole} onPick={(contactRole) => setB({ ...b, contactRole })} />
          <p className="mb-2 mt-5 text-sm font-medium text-ink">Team size</p>
          <Radio options={TEAM_SIZES} value={b.teamSize} onPick={(teamSize) => setB({ ...b, teamSize })} />
          <div className="mt-5 flex justify-end">
            <Button onClick={() => setBstep(4)}>Continue <ArrowRight className="size-4" /></Button>
          </div>
        </Shell>
      );
    return (
      <Shell title="Your brand details" subtitle="This is what creators see when you reach out." preview={preview} onBack={() => setBstep(3)}>
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
      </Shell>
    );
  }

  // ---- Creator wizard ----
  const canNext1 = c.firstName.trim() && c.handle.trim() && c.location.trim();
  const canNext2 = c.niches.length > 0;
  const canSubmit = c.startingRate > 0;

  return (
    <Shell
      title="Set up your creator profile"
      subtitle={`Step ${step} of 3`}
      preview={preview}
      onBack={step > 1 ? () => setStep(step - 1) : initialRole ? undefined : () => setRole(null)}
      progress={step / 3}
    >
      {step === 1 && (
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
            Brands see &ldquo;{c.firstName.trim() || "First"} {c.lastName.trim() ? c.lastName.trim()[0].toUpperCase() + "." : "L."}&rdquo; until you both agree on a booking, then your full name unlocks.
          </p>
          <Field label="Username" hint="Your shareable profile: ugcorigin.com/@username">
            <div className="flex items-center gap-2">
              <span className="text-ink-3">@</span>
              <Input value={c.handle} onChange={(e) => setC({ ...c, handle: e.target.value })} placeholder="amara.ugc" />
            </div>
          </Field>
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
          <Button onClick={() => setStep(2)} disabled={!canNext1}>
            Continue <ArrowRight className="size-4" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4">
          <Field label="Your niches" hint="Pick up to 5, what you make best.">
            <PillRow>
              {NICHES.map((n) => (
                <button key={n} type="button" onClick={() => toggleNiche(n)}>
                  <Chip active={c.niches.includes(n)}>{n}</Chip>
                </button>
              ))}
            </PillRow>
          </Field>
          <Button onClick={() => setStep(3)} disabled={!canNext2}>
            Continue <ArrowRight className="size-4" />
          </Button>
        </div>
      )}

      {step === 3 && (
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
            Next, you'll verify your identity and bank details to go live and get hired.
          </p>
        </div>
      )}
    </Shell>
  );
}

function Shell({
  title,
  subtitle,
  children,
  onBack,
  progress,
  preview,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  progress?: number;
  preview?: boolean;
}) {
  return (
    <div className="w-full max-w-md">
      {preview && (
        <div className="mb-5 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs text-ink-2">
          Preview, connect Supabase to save profiles.
        </div>
      )}
      {onBack && (
        <button onClick={onBack} className="mb-4 inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" /> Back
        </button>
      )}
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{title}</h1>
      {subtitle && <p className="mt-1.5 text-sm text-ink-2">{subtitle}</p>}
      {progress !== undefined && (
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div className={cn("h-full rounded-full bg-accent transition-all")} style={{ width: `${progress * 100}%` }} />
        </div>
      )}
      <div className="mt-6">{children}</div>
    </div>
  );
}
