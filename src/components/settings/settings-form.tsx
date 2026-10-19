"use client";

import { useRef, useState, useTransition, type ReactNode, type ChangeEvent, type FormEvent } from "react";
import { Camera, Check, Loader2, Trash2 } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field, Select } from "@/components/ui/input";
import { PhoneField } from "@/components/ui/phone-field";
import { NG_STATES } from "@/lib/categories";
import { CONTENT_FORMATS } from "@/lib/content-formats";
import { Chip } from "@/components/ui/chip";
import { PillRow } from "@/components/ui/pill-row";
import { TierBadge } from "@/components/ui/tier-badge";
import { cn, formatNaira } from "@/lib/utils";
import { tierMeta } from "@/lib/tiers";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { resizeToWebp } from "@/lib/image-resize";
import { validateFile, LIMITS, type UploadKind } from "@/lib/upload-limits";
import { NICHES } from "@/lib/sample-data";
import {
  updateCreatorSettings,
  updateBrandSettings,
  updateNotificationPrefs,
  type NotificationPrefs,
} from "@/app/settings/actions";

type Creator = {
  handle: string | null;
  display_name: string | null;
  bio: string | null;
  location: string | null;
  niches: string[] | null;
  content_formats: string[] | null;
  starting_rate_naira: number | null;
  avatar_url: string | null;
  tier: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
};
type Brand = {
  company_name: string | null;
  website: string | null;
  store_url: string | null;
  logo_url: string | null;
  phone?: string | null;
  contact_first_name?: string | null;
  contact_last_name?: string | null;
};

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "U";
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
}

/** Section wrapper with a title, body and a save row that shows status. */
function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="mt-5">
      <CardBody>
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-ink-3">{description}</p>}
        <div className="mt-5">{children}</div>
      </CardBody>
    </Card>
  );
}

function SaveRow({ pending, status }: { pending: boolean; status: "idle" | "saved" | "error"; }) {
  return (
    <div className="mt-6 flex items-center gap-3">
      <Button type="submit" disabled={pending} size="sm">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Save changes
      </Button>
      {status === "saved" && (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
          <Check className="size-4" /> Saved
        </span>
      )}
      {status === "error" && <span className="text-sm font-medium text-error">Couldn’t save, try again.</span>}
    </div>
  );
}

export function SettingsForm({
  userId,
  email,
  role,
  creator,
  brand,
  prefs,
}: {
  userId: string;
  email: string;
  role: "creator" | "brand";
  creator: Creator | null;
  brand: Brand | null;
  prefs: NotificationPrefs;
}) {
  return (
    <div>
      {role === "creator" && creator && <CreatorSettings userId={userId} creator={creator} />}
      {role === "brand" && brand && <BrandSettings userId={userId} brand={brand} />}
      <NotificationSettings initial={prefs} />
      <AccountSection email={email} />
    </div>
  );
}

/* ----------------------------- image uploader ----------------------------- */

function ImageUploader({
  userId,
  value,
  onChange,
  display,
  round = true,
  label,
  kind,
}: {
  userId: string;
  value: string | null;
  onChange: (url: string | null) => void;
  display: string;
  round?: boolean;
  label: string;
  kind: UploadKind;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr(null);
    const check = validateFile(file, kind);
    if (!check.ok) return setErr(check.error);
    if (!supabaseConfigured) return setErr("Backend not connected.");

    setBusy(true);
    // Downscale + convert to WebP in the browser: a ~512px WebP is a fraction of
    // the original size and loads fast. Avatars are cover-cropped square.
    const optimized = await resizeToWebp(file, { maxSize: 512, square: round, quality: 0.82 });
    const supabase = createClient();
    const ext = optimized.type === "image/webp" ? "webp" : (optimized.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, optimized, { upsert: true, cacheControl: "3600", contentType: optimized.type });
    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    onChange(data.publicUrl);
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-4">
      <div className={cn("relative size-20 overflow-hidden bg-surface-2", round ? "rounded-full" : "rounded-2xl")}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center bg-accent text-lg font-bold text-accent-ink">
            {initials(display)}
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-obsidian/40">
            <Loader2 className="size-5 animate-spin text-chalk" />
          </span>
        )}
      </div>
      <div>
        <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
            <Camera className="size-4" /> {value ? "Change" : "Upload"} {label}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)} disabled={busy}>
              <Trash2 className="size-4" /> Remove
            </Button>
          )}
        </div>
        <p className="mt-1.5 text-xs text-ink-3">{LIMITS[kind].typeHint} · {LIMITS[kind].guide}</p>
        {err && <p className="mt-1 text-xs font-medium text-error">{err}</p>}
      </div>
    </div>
  );
}

/* ----------------------------- creator settings ---------------------------- */

function CreatorSettings({ userId, creator }: { userId: string; creator: Creator }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(creator.avatar_url);
  const [handle, setHandle] = useState(creator.handle ?? "");
  const [firstName, setFirstName] = useState(creator.first_name ?? "");
  const [lastName, setLastName] = useState(creator.last_name ?? "");
  const displayName = `${firstName} ${lastName}`.trim() || creator.display_name || "";
  const [location, setLocation] = useState(creator.location ?? "");
  const [phone, setPhone] = useState<string | null>(creator.phone ?? null);
  const [bio, setBio] = useState(creator.bio ?? "");
  const [rate, setRate] = useState(creator.starting_rate_naira ? String(creator.starting_rate_naira) : "");
  const [niches, setNiches] = useState<string[]>(creator.niches ?? []);
  const [formats, setFormats] = useState<string[]>(creator.content_formats ?? []);
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const meta = tierMeta(creator.tier);
  const floor = meta.floorNaira;

  function toggleNiche(n: string) {
    setNiches((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await updateCreatorSettings({
        handle,
        firstName,
        lastName,
        displayName,
        location,
        phone,
        bio,
        niches,
        contentFormats: formats,
        startingRate: Number(rate) || 0,
        avatarUrl,
      });
      if (res.error) {
        setError(res.error);
        setStatus("error");
      } else {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2500);
      }
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <Section title="Profile photo" description="A real photo of you builds trust with brands.">
        <ImageUploader userId={userId} value={avatarUrl} onChange={setAvatarUrl} display={displayName || handle} label="photo" kind="avatar" />
      </Section>

      <Section title="Your tier" description="Your standing grows as you complete gigs and earn reviews, you move up one tier at a time, never by skipping.">
        <div className="flex flex-wrap items-center gap-3">
          <TierBadge tier={creator.tier} size="md" />
          <p className="text-sm text-ink-2">{meta.tagline}</p>
        </div>
        <p className="mt-3 text-xs text-ink-3">
          Price floor at this tier: <span className="font-medium text-ink-2">{formatNaira(floor)}</span>. You can’t be priced below it.
        </p>
      </Section>

      <Section title="Public profile" description="This is what brands see on your card.">
        <div className="grid gap-4">
          <Field label="Username" hint="Your public link: ugcorigin.com/@your-handle. Changing it breaks old links.">
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-3">@</span>
              <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="yourname" />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name">
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Amara" />
            </Field>
            <Field label="Last name" hint="Public shows initial only">
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Obi" />
            </Field>
          </div>
          <p className="-mt-1 text-xs text-ink-3">
            Brands see &ldquo;{firstName.trim() || "First"} {lastName.trim() ? lastName.trim()[0].toUpperCase() + "." : "L."}&rdquo; until you both agree on a booking, then your full name and socials unlock.
          </p>
          <Field label="Location" hint="Where you're based in Nigeria.">
            <Select value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="">Select your state</option>
              {NG_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Phone number" hint="For booking coordination. Hidden until you both agree on a gig.">
            <PhoneField value={phone} onChange={setPhone} />
          </Field>
          <Field label="Bio" hint="A short line on what you make and who for.">
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="I make beauty & skincare UGC for Nigerian brands…" />
          </Field>
          <Field
            label="Starting rate (₦)"
            hint={`Your ${meta.label}-tier floor is ${formatNaira(floor)}. Brands can still send custom offers above it.`}
          >
            <Input
              type="number"
              inputMode="numeric"
              min={floor}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              onBlur={() => {
                if (rate && Number(rate) < floor) setRate(String(floor));
              }}
              placeholder={String(floor)}
            />
          </Field>
          <Field label="Niches" hint="Pick the categories you create in, scroll to see all.">
            <PillRow>
              {NICHES.map((n) => (
                <button key={n} type="button" onClick={() => toggleNiche(n)}>
                  <Chip active={niches.includes(n)}>{n}</Chip>
                </button>
              ))}
            </PillRow>
          </Field>
          <Field label="What you offer" hint="The formats you deliver, so brands know what to ask for.">
            <div className="flex flex-wrap gap-2">
              {CONTENT_FORMATS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFormats((prev) => (prev.includes(f.value) ? prev.filter((x) => x !== f.value) : [...prev, f.value]))}
                >
                  <Chip active={formats.includes(f.value)}>{f.label}</Chip>
                </button>
              ))}
            </div>
          </Field>
        </div>
        {error && <p className="mt-3 text-sm font-medium text-error">{error}</p>}
        <SaveRow pending={pending} status={status} />
      </Section>
    </form>
  );
}

/* ------------------------------ brand settings ----------------------------- */

function BrandSettings({ userId, brand }: { userId: string; brand: Brand }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(brand.logo_url);
  const [companyName, setCompanyName] = useState(brand.company_name ?? "");
  const [contactFirstName, setContactFirstName] = useState(brand.contact_first_name ?? "");
  const [contactLastName, setContactLastName] = useState(brand.contact_last_name ?? "");
  const [website, setWebsite] = useState(brand.website ?? "");
  const [storeUrl, setStoreUrl] = useState(brand.store_url ?? "");
  const [phone, setPhone] = useState<string | null>(brand.phone ?? null);
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await updateBrandSettings({ companyName, contactFirstName, contactLastName, website, storeUrl, phone, logoUrl });
      if (res.error) {
        setError(res.error);
        setStatus("error");
      } else {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2500);
      }
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <Section title="Brand logo" description="Shown on your offers and briefs.">
        <ImageUploader userId={userId} value={logoUrl} onChange={setLogoUrl} display={companyName} round={false} label="logo" kind="logo" />
      </Section>

      <Section title="Company">
        <div className="grid gap-4">
          <Field label="Company / store name">
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your brand" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact first name" hint="Shared with a creator after you book.">
              <Input value={contactFirstName} onChange={(e) => setContactFirstName(e.target.value)} placeholder="Chidi" />
            </Field>
            <Field label="Contact last name" hint="Optional">
              <Input value={contactLastName} onChange={(e) => setContactLastName(e.target.value)} placeholder="Okafor" />
            </Field>
          </div>
          <Field label="Website">
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourbrand.com" />
          </Field>
          <Field label="Store URL" hint="Where people buy, Instagram shop, Shopify, etc.">
            <Input value={storeUrl} onChange={(e) => setStoreUrl(e.target.value)} placeholder="https://instagram.com/yourbrand" />
          </Field>
          <Field label="Phone number" hint="For booking coordination. Shared with a creator only after you agree on a gig.">
            <PhoneField value={phone} onChange={setPhone} />
          </Field>
        </div>
        {error && <p className="mt-3 text-sm font-medium text-error">{error}</p>}
        <SaveRow pending={pending} status={status} />
      </Section>
    </form>
  );
}

/* --------------------------- notification settings -------------------------- */

const NOTIFY_ROWS: { key: keyof NotificationPrefs; title: string; desc: string }[] = [
  { key: "notify_offers", title: "Offers & gigs", desc: "New offers, applications and gig updates." },
  { key: "notify_payouts", title: "Payments", desc: "Escrow funded, work approved, payouts sent." },
  { key: "notify_reviews", title: "Reviews & disputes", desc: "New reviews and anything needing your attention." },
  { key: "notify_product", title: "Product news", desc: "Occasional tips and platform updates. (Optional)" },
];

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        on ? "bg-accent" : "bg-surface-2 border border-line",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-5 rounded-full bg-paper shadow transition-transform",
          on ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function NotificationSettings({ initial }: { initial: NotificationPrefs }) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(initial);
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await updateNotificationPrefs(prefs);
      if (res.error) {
        setStatus("error");
      } else {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2500);
      }
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <Section title="Notifications" description="Choose what we email and alert you about.">
        <div className="divide-y divide-line rounded-2xl border border-line">
          {NOTIFY_ROWS.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4 px-4 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{row.title}</p>
                <p className="text-xs text-ink-3">{row.desc}</p>
              </div>
              <Toggle on={prefs[row.key]} onClick={() => setPrefs((p) => ({ ...p, [row.key]: !p[row.key] }))} />
            </div>
          ))}
        </div>
        <SaveRow pending={pending} status={status} />
      </Section>
    </form>
  );
}

/* ------------------------------- account ------------------------------------ */

function AccountSection({ email }: { email: string }) {
  return (
    <Section title="Account">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <Field label="Email" className="flex-1">
          <Input value={email} readOnly disabled />
        </Field>
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="secondary" size="sm">Sign out</Button>
        </form>
      </div>
    </Section>
  );
}
