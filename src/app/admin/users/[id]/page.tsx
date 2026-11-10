import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminContentSkeleton } from "@/components/ui/skeleton";
import { Card, CardBody } from "@/components/ui/card";
import { TierBadge } from "@/components/ui/tier-badge";
import { requireSection } from "@/lib/admin/rbac";
import { ROLE_LABEL, type AdminRole } from "@/lib/admin/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { privateUrlFromRef } from "@/lib/cloudinary-server";
import { listBanks } from "@/lib/payments/paystack";
import { fullName } from "@/lib/names";
import { formatPhone } from "@/lib/phone";
import { formatNaira } from "@/lib/utils";
import { parseGoals } from "@/lib/brand-options";

export const metadata: Metadata = { title: "Admin · User" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SIGNAL_LABEL: Record<string, string> = {
  brand_signup: "Brand signup",
  brand_verify: "Brand verification",
  creator_signup: "Creator signup",
  creator_verify: "Creator verification",
  first_seen: "First seen",
};

type Signal = { event: string; ip: string | null; country: string | null; region: string | null; city: string | null; user_agent: string | null; created_at: string };

function yesNo(value: boolean | null | undefined) {
  return value ? "Yes" : "No";
}

function mask(value: string | null | undefined, reveal: boolean) {
  if (!value) return "—";
  if (reveal) return value;
  return `•••• ${value.slice(-4)}`;
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 py-2 sm:grid-cols-[11rem_1fr] sm:gap-3">
      <dt className="text-sm text-ink-3">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-ink">{value || "—"}</dd>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      {note && <p className="mt-1 text-sm text-ink-2">{note}</p>}
      <Card className="mt-3">
        <CardBody>{children}</CardBody>
      </Card>
    </section>
  );
}

async function UserInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { role } = await requireSection("users");
  const seeIdentity = role === "super_admin" || role === "trust_safety";
  const seePayout = seeIdentity || role === "finance";

  const admin = createAdminClient();
  const [{ data: creator }, { data: brand }, { data: membership }, authResult] = await Promise.all([
    admin
      .from("creator_profiles")
      .select("id, handle, display_name, first_name, middle_name, last_name, bio, location, niches, content_formats, starting_rate_naira, avatar_url, tier, is_live, suspended, featured, completeness, identity_verified, photo_verified, bank_verified, verification_status, phone, payout_bank_code, payout_account_number, strikes, benched, strike_note, is_influencer, created_at")
      .eq("id", id)
      .maybeSingle(),
    admin
      .from("brand_profiles")
      .select("company_name, contact_first_name, contact_last_name, website, store_url, logo_url, phone, rc_number, verification_status, verification_note, verification_submitted_at, goal, ad_platforms, content_types, business_type, contact_role, team_size, trust_tier, registered_address, director_name, director_id_hash, director_consent_at, person_verified, created_at")
      .eq("id", id)
      .maybeSingle(),
    admin.from("admin_users").select("role, created_at").eq("user_id", id).maybeSingle(),
    admin.auth.admin.getUserById(id),
  ]);

  const email = authResult.data?.user?.email ?? null;
  if (!creator && !brand && !membership && !email) notFound();

  const [{ data: socials }, { data: portfolio }, { data: videos }, { data: packages }, { data: submission }, { data: notes }, { data: signals }] = await Promise.all([
    creator
      ? admin.from("social_accounts").select("platform, handle, url, verified").eq("creator_id", id)
      : Promise.resolve({ data: [] as { platform: string; handle: string; url: string | null; verified: boolean }[] }),
    creator
      ? admin.from("portfolio_links").select("platform, url").eq("creator_id", id).order("position", { ascending: true })
      : Promise.resolve({ data: [] as { platform: string; url: string }[] }),
    creator
      ? admin.from("profile_videos").select("url").eq("creator_id", id).order("position", { ascending: true })
      : Promise.resolve({ data: [] as { url: string }[] }),
    creator
      ? admin.from("packages").select("title, price_naira, active").eq("creator_id", id)
      : Promise.resolve({ data: [] as { title: string; price_naira: number; active: boolean }[] }),
    admin.from("identity_submissions").select("nin, nin_hash, selfie_ref, phone, status, reject_reason, submitted_at").eq("user_id", id).order("submitted_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("profile_notes").select("id, kind, subject, body, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(50),
    admin.from("account_signals").select("event, ip, country, region, city, user_agent, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(20),
  ]);

  // Resolve the stored payout bank CODE (e.g. "058", or "999992" for Paystack's
  // test bank) to a human bank name, so the profile doesn't show a bare number.
  const banks = creator?.payout_bank_code ? await listBanks() : [];
  const payoutBankName = banks.find((b) => b.code === creator?.payout_bank_code)?.name ?? null;
  const sigs = (signals ?? []) as Signal[];

  const selfieUrl = seeIdentity && submission?.selfie_ref ? privateUrlFromRef(submission.selfie_ref) : null;
  const legalName = creator
    ? fullName({ first: creator.first_name, middle: creator.middle_name, last: creator.last_name, display: creator.display_name, handle: creator.handle })
    : null;
  const adminRole = membership && membership.role in ROLE_LABEL ? ROLE_LABEL[membership.role as AdminRole] : null;
  const title = creator?.display_name || brand?.company_name || email || "User";

  return (
    <>
      <p className="text-sm text-ink-3">
        <Link href="/admin/users" className="hover:text-ink">Users</Link>
        <span> / {title}</span>
      </p>
      <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">{title}</h1>
      <p className="mt-1 text-sm text-ink-2">{email || "No email on this account"}</p>

      {adminRole && (
        <Section
          title="Admin role"
          note="This is separate from the brand profile and the creator profile on the same email. Admin access does not verify the brand, and brand verification does not grant admin actions."
        >
          <dl className="divide-y divide-line">
            <Fact label="Role" value={adminRole} />
            <Fact label="Since" value={membership?.created_at ? new Date(membership.created_at).toLocaleString() : "—"} />
          </dl>
        </Section>
      )}

      {creator && (
        <Section title="Creator profile" note="What this person is on the marketplace, including the private checks behind verification.">
          <div className="flex flex-wrap items-start gap-4">
            {creator.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={creator.avatar_url} alt="" className="size-20 rounded-full object-cover" />
            ) : (
              <div className="grid size-20 place-items-center rounded-full bg-surface-2 text-xs text-ink-3">No public photo</div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-ink">{legalName}</p>
                <TierBadge tier={creator.tier} />
              </div>
              {creator.handle && (
                <Link href={`/${creator.handle}`} className="text-sm text-accent hover:underline">@{creator.handle}</Link>
              )}
              {!creator.avatar_url && (
                <p className="mt-2 max-w-md text-xs text-ink-3">The public card shows initials until the verification face photo is copied across, or they upload a profile photo.</p>
              )}
            </div>
          </div>
          <dl className="mt-4 divide-y divide-line">
            <Fact label="Display name" value={creator.display_name} />
            <Fact label="Legal name" value={[creator.first_name, creator.middle_name, creator.last_name].filter(Boolean).join(" ")} />
            <Fact label="Location" value={creator.location} />
            <Fact label="Phone" value={formatPhone(creator.phone) || "—"} />
            <Fact label="Bio" value={creator.bio} />
            <Fact label="Niches" value={(creator.niches ?? []).join(", ")} />
            <Fact label="Formats" value={(creator.content_formats ?? []).join(", ")} />
            <Fact label="Starting rate" value={creator.starting_rate_naira ? formatNaira(creator.starting_rate_naira) : "—"} />
            <Fact label="Completeness" value={`${creator.completeness ?? 0}%`} />
            <Fact label="Live" value={yesNo(creator.is_live)} />
            <Fact label="Suspended" value={yesNo(creator.suspended)} />
            <Fact label="Featured" value={yesNo(creator.featured)} />
            <Fact label="Influencer" value={yesNo(creator.is_influencer)} />
            <Fact label="Verification" value={creator.verification_status} />
            <Fact label="Identity" value={yesNo(creator.identity_verified)} />
            <Fact label="Photo check" value={yesNo(creator.photo_verified)} />
            <Fact label="Bank check" value={yesNo(creator.bank_verified)} />
            <Fact label="Strikes" value={String(creator.strikes ?? 0)} />
            <Fact label="Benched" value={yesNo(creator.benched)} />
            <Fact label="Strike note" value={creator.strike_note} />
            <Fact label="Joined" value={creator.created_at ? new Date(creator.created_at).toLocaleString() : "—"} />
            <Fact
              label="Payout bank"
              value={
                creator.payout_bank_code
                  ? payoutBankName
                    ? `${payoutBankName} (${creator.payout_bank_code})`
                    : creator.payout_bank_code
                  : "—"
              }
            />
            <Fact label="Account number" value={mask(creator.payout_account_number, seePayout)} />
          </dl>
        </Section>
      )}

      <Section
        title="Identity submission"
        note={seeIdentity ? "The face photo is also the public profile photo unless they upload a different one. The identity code is deleted after review." : "The identity code and selfie are visible to Trust & Safety and Super Admin while a review is open."}
      >
        {!submission && <p className="text-sm text-ink-2">No identity submission on file.</p>}
        {submission && (
          <div className="flex flex-wrap items-start gap-4">
            {selfieUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selfieUrl} alt="Verification selfie" className="size-28 rounded-xl object-cover" />
            ) : (
              <div className="grid size-28 place-items-center rounded-xl bg-surface-2 px-2 text-center text-xs text-ink-3">
                {submission.selfie_ref ? "Selfie on file" : "No selfie"}
              </div>
            )}
            <dl className="min-w-0 flex-1 divide-y divide-line">
              <Fact label="Status" value={submission.status} />
              <Fact label="Virtual NIN" value={submission.nin ? mask(submission.nin, seeIdentity) : submission.nin_hash ? "Deleted after review" : "—"} />
              <Fact label="Phone on form" value={formatPhone(submission.phone) || submission.phone || "—"} />
              <Fact label="Submitted" value={submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : "—"} />
            </dl>
          </div>
        )}
      </Section>

      {creator && (
        <Section title="Work and links">
          <dl className="divide-y divide-line">
            <Fact
              label="Socials"
              value={(socials ?? []).length ? (socials ?? []).map((s) => `${s.platform}: ${s.handle}${s.verified ? " (verified)" : ""}`).join(" · ") : "—"}
            />
            <Fact
              label="Portfolio"
              value={(portfolio ?? []).length ? (portfolio ?? []).map((p) => p.url).join(" · ") : "—"}
            />
            <Fact label="Videos" value={(videos ?? []).length ? `${videos?.length} showcase video${videos?.length === 1 ? "" : "s"}` : "—"} />
            <Fact
              label="Packages"
              value={(packages ?? []).length ? (packages ?? []).map((p) => `${p.title} ${formatNaira(p.price_naira)}${p.active ? "" : " (off)"}`).join(" · ") : "—"}
            />
          </dl>
        </Section>
      )}

      <Section title="Notes sent" note="Placement and verification notes this account received. The same text is in their notification and email.">
        {(notes ?? []).length === 0 && !submission?.reject_reason && !brand?.verification_note ? (
          <p className="text-sm text-ink-3">No notes yet.</p>
        ) : (
          <ul className="grid gap-4">
            {(notes ?? []).map((note) => (
              <li key={note.id}>
                <p className="text-xs text-ink-3">
                  {note.kind.replace(/_/g, " ")} · {new Date(note.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                </p>
                <p className="mt-1 text-sm font-medium text-ink">{note.subject}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink-2">{note.body}</p>
              </li>
            ))}
            {(notes ?? []).length === 0 && submission?.reject_reason && (
              <li>
                <p className="text-xs text-ink-3">Identity rejection</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink-2">{submission.reject_reason}</p>
              </li>
            )}
            {(notes ?? []).length === 0 && brand?.verification_note && (
              <li>
                <p className="text-xs text-ink-3">Brand verification</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink-2">{brand.verification_note}</p>
              </li>
            )}
          </ul>
        )}
      </Section>

      {brand && (
        <Section
          title="Brand profile"
          note="Hiring tools live here. They stay separate from any admin role on this email."
        >
          <div className="flex flex-wrap items-start gap-4">
            {brand.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logo_url} alt="" className="size-16 rounded-2xl object-cover" />
            ) : (
              <div className="grid size-16 place-items-center rounded-2xl bg-surface-2 text-xs text-ink-3">No logo</div>
            )}
            <p className="font-semibold text-ink">{brand.company_name || "Unnamed business"}</p>
          </div>
          <dl className="mt-4 divide-y divide-line">
            <Fact label="Contact" value={[brand.contact_first_name, brand.contact_last_name].filter(Boolean).join(" ")} />
            <Fact label="Role" value={brand.contact_role} />
            <Fact label="Phone" value={formatPhone(brand.phone) || "—"} />
            <Fact label="Website" value={brand.website} />
            <Fact label="Store" value={brand.store_url} />
            <Fact label="RC / CAC" value={brand.rc_number} />
            <Fact label="Registered address" value={brand.registered_address} />
            <Fact label="Responsible person" value={brand.director_name} />
            <Fact label="Person ID (vNIN)" value={brand.director_id_hash ? (brand.person_verified ? "Verified, code cleared" : "Submitted, pending review") : "—"} />
            <Fact label="Person verified" value={yesNo(brand.person_verified)} />
            <Fact label="Person consent" value={brand.director_consent_at ? new Date(brand.director_consent_at).toLocaleString() : "—"} />
            <Fact label="Verification" value={brand.verification_status} />
            <Fact label="Note" value={brand.verification_note} />
            <Fact label="Submitted" value={brand.verification_submitted_at ? new Date(brand.verification_submitted_at).toLocaleString() : "—"} />
            <Fact label="Business" value={brand.business_type} />
            <Fact label="Team" value={brand.team_size} />
            <Fact label="Trust" value={brand.trust_tier} />
            <Fact label="Goals" value={parseGoals(brand.goal).join(", ")} />
            <Fact label="Ad platforms" value={(brand.ad_platforms ?? []).join(", ")} />
            <Fact label="Content" value={(brand.content_types ?? []).join(", ")} />
            <Fact label="Joined" value={brand.created_at ? new Date(brand.created_at).toLocaleString() : "—"} />
          </dl>
        </Section>
      )}

      <Section
        title="Integrity signals"
        note="IP, approximate location and device captured at signup and verification (and on first visit for older accounts). Watch for signups that cluster on one IP, or a location that does not match the stated business."
      >
        {sigs.length === 0 ? (
          <p className="text-sm text-ink-3">No signals yet. Captured on the next signup or verification, and backfilled on the next visit.</p>
        ) : (
          <ul className="divide-y divide-line">
            {sigs.map((s, i) => (
              <li key={i} className="grid gap-0.5 py-2 sm:grid-cols-[11rem_1fr_auto] sm:items-baseline sm:gap-3">
                <span className="text-sm font-medium text-ink">{SIGNAL_LABEL[s.event] ?? s.event}</span>
                <span className="min-w-0 text-sm text-ink-2">
                  {[s.city, s.region, s.country].filter(Boolean).join(", ") || "Location unknown"}
                  <span className="ml-2 font-mono text-xs text-ink-3">{s.ip || "no IP"}</span>
                </span>
                <span className="shrink-0 text-xs text-ink-3">{s.created_at ? new Date(s.created_at).toLocaleString() : ""}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}

export default function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<AdminContentSkeleton />}>
      <UserInner params={params} />
    </Suspense>
  );
}
