import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardBody } from "@/components/ui/card";
import { VerificationRow } from "@/components/admin/verification-row";
import { BrandVerificationRow } from "@/components/admin/brand-verification-row";
import { IdentitySubmissionRow } from "@/components/admin/identity-submission-row";
import { EntrySignalsControl } from "@/components/admin/entry-signals-control";
import { VerifyReminder } from "@/components/admin/verify-reminder";
import { requireSection, isReadonly } from "@/lib/admin/rbac";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { privateUrlFromRef } from "@/lib/cloudinary-server";
import { placementDefaults } from "@/lib/creators/apply-placement";
import { AdminListControls } from "@/components/admin/list-controls";
import { pageCount, pageWindow, readPage, readQuery } from "@/lib/admin/list";

export const metadata: Metadata = { title: "Admin · Verification" };

function Flag({ on, label }: { on: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-2">
      {on ? <Check className="size-3.5 text-success" /> : <X className="size-3.5 text-ink-3" />} {label}
    </span>
  );
}

const IDENTITY_STATUS = [
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "approved", label: "Approved" },
];
const BRAND_STATUS = [
  { value: "pending", label: "Pending" },
  { value: "unverified", label: "Unverified" },
  { value: "verified", label: "Verified" },
];

async function VerificationInner({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { role } = await requireSection("verification");
  const supabase = await createClient();
  const sp = await searchParams;
  const q = readQuery(sp.q);
  const cq = readQuery(sp.cq);
  const bq = readQuery(sp.bq);
  const status = IDENTITY_STATUS.some((item) => item.value === sp.status) ? sp.status! : "pending";
  const bstatus = BRAND_STATUS.some((item) => item.value === sp.bstatus) ? sp.bstatus! : "pending";
  const page = readPage(sp.page);
  const cpage = readPage(sp.cpage);
  const bpage = readPage(sp.bpage);

  let waiting = supabase
    .from("creator_profiles")
    .select("id, handle, display_name, completeness, bank_verified, identity_verified, is_live", { count: "exact" })
    .eq("identity_verified", false)
    .gt("completeness", 0)
    .order("completeness", { ascending: false });
  if (cq) waiting = waiting.or(`display_name.ilike.%${cq}%,handle.ilike.%${cq}%`);
  const waitingWindow = pageWindow(cpage);
  const { data, count: waitingCount } = await waiting.range(waitingWindow.from, waitingWindow.to);

  const rows = data ?? [];
  const readonly = isReadonly(role);

  // Manual identity submissions (selfie + NIN) awaiting a human reviewer. These
  // live in a service-role-only table, so read them with the admin client and
  // mint a short-lived signed URL for each selfie.
  const admin = createAdminClient();
  let matchedIds: string[] | null = null;
  if (q) {
    const { data: matches } = await supabase.from("creator_profiles").select("id").or(`display_name.ilike.%${q}%,handle.ilike.%${q}%`).limit(80);
    matchedIds = (matches ?? []).map((row) => row.id);
  }
  let subsQuery = admin
    .from("identity_submissions")
    .select("user_id, nin, selfie_ref, phone, submitted_at", { count: "exact" })
    .eq("status", status)
    .order("submitted_at", { ascending: true });
  if (matchedIds) subsQuery = matchedIds.length ? subsQuery.in("user_id", matchedIds) : subsQuery.eq("user_id", "00000000-0000-0000-0000-000000000000");
  const subsWindow = pageWindow(page);
  const { data: subData, count: subCount } = await subsQuery.range(subsWindow.from, subsWindow.to);
  const subs = subData ?? [];
  const subCreators = new Map<string, { handle: string | null; display_name: string | null }>();
  if (subs.length) {
    const { data: cs } = await supabase
      .from("creator_profiles")
      .select("id, handle, display_name")
      .in("id", subs.map((s) => s.user_id));
    (cs ?? []).forEach((c) => subCreators.set(c.id, { handle: c.handle, display_name: c.display_name }));
  }
  const submissions = await Promise.all(subs.map(async (s) => {
    const place = await placementDefaults(s.user_id).catch(() => null);
    return {
      ...s,
      handle: subCreators.get(s.user_id)?.handle ?? null,
      displayName: subCreators.get(s.user_id)?.display_name ?? null,
      selfieUrl: privateUrlFromRef(s.selfie_ref),
      tier: place?.tier ?? "origin" as const,
      rate: place?.rate ?? 10000,
      typicals: place?.typicals ?? { origin: 10000, rising: 20000, pro: 35000 },
      summary: place?.summary ?? "Origin",
    };
  }));

  // Current entry-credibility signals for the listed creators (for prefill).
  const ids = rows.map((c) => c.id);
  const signals = new Map<string, { verified_followers: number; prior_work_score: number }>();
  if (ids.length) {
    const { data: sig } = await supabase
      .from("entry_signals")
      .select("creator_id, verified_followers, prior_work_score")
      .in("creator_id", ids);
    (sig ?? []).forEach((s) => signals.set(s.creator_id, { verified_followers: s.verified_followers ?? 0, prior_work_score: s.prior_work_score ?? 0 }));
  }

  // rc_number SELECT is revoked from anon/authenticated at the column level, so
  // read the pending-brand queue through the service-role admin client.
  let brandQuery = admin
    .from("brand_profiles")
    .select("id, company_name, rc_number, verification_submitted_at", { count: "exact" })
    .eq("verification_status", bstatus)
    .order("verification_submitted_at", { ascending: true });
  if (bq) brandQuery = brandQuery.ilike("company_name", `%${bq}%`);
  const brandWindow = pageWindow(bpage);
  const { data: brandData, count: brandCount } = await brandQuery.range(brandWindow.from, brandWindow.to);
  const brands = brandData ?? [];

  return (
    <AdminShell role={role} active="verification">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Verification queue</h1>
      <p className="mt-1.5 text-sm text-ink-2">Creators who&apos;ve completed onboarding and are awaiting identity verification.</p>

      <h2 className="mt-7 font-display text-lg font-semibold text-ink">Identity submissions</h2>
      <AdminListControls
        pathname="/admin/verification"
        q={q}
        placeholder="Name or username"
        filters={[{ name: "status", label: "Status", value: status, options: IDENTITY_STATUS }]}
        page={Math.min(page, pageCount(subCount))}
        pages={pageCount(subCount)}
        total={subCount ?? 0}
        hidden={{ cq, bq, cpage: cpage > 1 ? String(cpage) : undefined, bpage: bpage > 1 ? String(bpage) : undefined, bstatus: bstatus === "pending" ? undefined : bstatus }}
      />
      <p className="mt-0.5 text-sm text-ink-2">Manual review: check the face photo against the Virtual NIN, then approve or reject. The code is deleted once you decide.</p>
      <div className="mt-4 grid gap-3">
        {submissions.length === 0 && (
          <Card variant="outline"><CardBody className="py-10 text-center text-ink-2">No photo submissions waiting.</CardBody></Card>
        )}
        {submissions.map((s) => (
          <Card key={s.user_id}>
            <CardBody>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {s.selfieUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.selfieUrl} alt="Submitted selfie" className="size-24 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className="grid size-24 shrink-0 place-items-center rounded-xl bg-surface-2 text-xs text-ink-3">No photo</div>
                  )}
                  <div className="min-w-0">
                    <Link href={`/admin/users/${s.user_id}`} className="font-semibold text-ink hover:text-accent">{s.displayName || `@${s.handle}`}</Link>
                    <p className="text-xs text-ink-3">@{s.handle} · full record</p>
                    <dl className="mt-2 grid gap-0.5 text-sm">
                      <div className="flex gap-2"><dt className="text-ink-3">Virtual NIN</dt><dd className="font-mono text-ink">{s.nin || "—"}</dd></div>
                      <div className="flex gap-2"><dt className="text-ink-3">Phone</dt><dd className="text-ink-2">{s.phone || "—"}</dd></div>
                      <div className="flex gap-2"><dt className="text-ink-3">Submitted</dt><dd className="text-ink-2">{s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "—"}</dd></div>
                    </dl>
                  </div>
                </div>
                <IdentitySubmissionRow creatorId={s.user_id} readonly={readonly} tier={s.tier} rate={s.rate} typicals={s.typicals} summary={s.summary} />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <h2 className="mt-10 font-display text-lg font-semibold text-ink">All awaiting identity</h2>
      <AdminListControls
        pathname="/admin/verification"
        q={cq}
        queryParam="cq"
        pageParam="cpage"
        placeholder="Name or username"
        page={Math.min(cpage, pageCount(waitingCount))}
        pages={pageCount(waitingCount)}
        total={waitingCount ?? 0}
        hidden={{ q, bq, status: status === "pending" ? undefined : status, page: page > 1 ? String(page) : undefined, bpage: bpage > 1 ? String(bpage) : undefined, bstatus: bstatus === "pending" ? undefined : bstatus }}
      />
      <div className="mt-4 grid gap-3">
        {rows.length === 0 && (
          <Card variant="outline"><CardBody className="py-12 text-center text-ink-2">Nobody waiting. 🎉</CardBody></Card>
        )}
        {rows.map((c) => (
          <Card key={c.id}>
            <CardBody>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link href={`/admin/users/${c.id}`} className="font-semibold text-ink hover:text-accent">{c.display_name || `@${c.handle}`}</Link>
                  <p className="text-xs text-ink-3">@{c.handle} · {c.completeness}% complete · full record</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <Flag on={!!c.bank_verified} label="Bank" />
                    <Flag on={!!c.identity_verified} label="Identity" />
                    <Flag on={!!c.is_live} label="Live" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <VerificationRow id={c.id} identityVerified={!!c.identity_verified} isLive={!!c.is_live} readonly={readonly} />
                  <VerifyReminder userId={c.id} role="creator" readonly={readonly} />
                </div>
              </div>
              <EntrySignalsControl
                creatorId={c.id}
                followers={signals.get(c.id)?.verified_followers ?? 0}
                priorWork={signals.get(c.id)?.prior_work_score ?? 0}
                readonly={readonly}
              />
            </CardBody>
          </Card>
        ))}
      </div>

      <h2 className="mt-10 font-display text-lg font-semibold text-ink">Brand verification</h2>
      <AdminListControls
        pathname="/admin/verification"
        q={bq}
        queryParam="bq"
        pageParam="bpage"
        placeholder="Company name"
        filters={[{ name: "bstatus", label: "Status", value: bstatus, options: BRAND_STATUS }]}
        page={Math.min(bpage, pageCount(brandCount))}
        pages={pageCount(brandCount)}
        total={brandCount ?? 0}
        hidden={{ q, cq, status: status === "pending" ? undefined : status, page: page > 1 ? String(page) : undefined, cpage: cpage > 1 ? String(cpage) : undefined }}
      />
      <p className="mt-0.5 text-sm text-ink-2">Businesses awaiting review. Check the CAC/RC number against the company name.</p>
      <div className="mt-4 grid gap-3">
        {brands.length === 0 && (
          <Card variant="outline"><CardBody className="py-10 text-center text-ink-2">No brands waiting.</CardBody></Card>
        )}
        {brands.map((b) => (
          <Card key={b.id}>
            <CardBody>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link href={`/admin/users/${b.id}`} className="font-semibold text-ink hover:text-accent">{b.company_name || "Unnamed business"}</Link>
                  <p className="text-xs text-ink-3">RC/CAC: {b.rc_number || "—"}{b.verification_submitted_at ? ` · submitted ${new Date(b.verification_submitted_at).toLocaleDateString()}` : ""} · full record</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <BrandVerificationRow brandId={b.id} readonly={readonly} />
                  <VerifyReminder userId={b.id} role="brand" readonly={readonly} />
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}

export default function AdminVerificationPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <VerificationInner searchParams={searchParams} />
    </Suspense>
  );
}
