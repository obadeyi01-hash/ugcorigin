"use client";

import { useState, useTransition } from "react";
import { ArrowRight, ArrowLeft, Video, Store, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PillRow } from "@/components/ui/pill-row";
import { Input, Textarea, Field, Select } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";
import { NICHES } from "@/lib/sample-data";
import { REGIONS } from "@/lib/categories";
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
    bio: "",
    niches: [],
    startingRate: 0,
  });
  const [step, setStep] = useState(1);

  // brand fields
  const [b, setB] = useState<BrandInput>({ companyName: "", website: "", storeUrl: "" });

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

  // ---- Brand form ----
  if (role === "brand") {
    return (
      <Shell title="Tell us about your brand" subtitle="This helps creators understand who they're working with." preview={preview} onBack={() => setRole(initialRole ? role : null)}>
        <div className="grid gap-4">
          <Field label="Company / store name">
            <Input value={b.companyName} onChange={(e) => setB({ ...b, companyName: e.target.value })} placeholder="e.g. Zuri Skincare" />
          </Field>
          <Field label="Website" hint="Optional">
            <Input value={b.website} onChange={(e) => setB({ ...b, website: e.target.value })} placeholder="https://" />
          </Field>
          <Field label="Online store" hint="Optional, Shopify, Instagram shop, etc.">
            <Input value={b.storeUrl} onChange={(e) => setB({ ...b, storeUrl: e.target.value })} placeholder="https://" />
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
          <Field label="Region">
            <Select value={c.location} onChange={(e) => setC({ ...c, location: e.target.value })}>
              <option value="">Select your region</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
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
