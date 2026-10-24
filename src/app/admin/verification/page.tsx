import type { Metadata } from "next";
import { Suspense } from "react";
import { Check, X } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardBody } from "@/components/ui/card";
import { VerificationRow } from "@/components/admin/verification-row";
import { BrandVerificationRow } from "@/components/admin/brand-verification-row";
import { IdentitySubmissionRow } from "@/components/admin/identity-submission-row";
import { EntrySignalsControl } from "@/components/admin/entry-signals-control";
import { requireSection, isReadonly } from "@/lib/admin/rbac";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { privateUrlFromRef } from "@/lib/cloudinary-server";

export const metadata: Metadata = { title: "Admin · Verification" };

function Flag({ on, label }: { on: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-2">
      {on ? <Check className="size-3.5 text-success" /> : <X className="size-3.5 text-ink-3" />} {label}
    </span>
  );
}

async function VerificationInner() {
  const { role } = await requireSection("verification");
  const supabase = await createClient();

  const { data } = await supabase
    .from("creator_profiles")
    .select("id, handle, display_name, completeness, bank_verified, identity_verified, is_live")
    .eq("identity_verified", false)
    .gt("completeness", 0)
    .order("completeness", { ascending: false })
    .limit(100);

  const rows = data ?? [];
  const readonly = isReadonly(role);

  // Manual identity submissions (selfie + NIN) awaiting a human reviewer. These
  // live in a service-role-only table, so read them with the admin client and
  // mint a short-lived signed URL for each selfie.
  const admin = createAdminClient();
  const { data: subData } = await admin
    .from("identity_submissions")
    .select("user_id, nin, selfie_ref, phone, submitted_at")
    .eq("status", "pending")
    .order("submitted_at", { ascending: true })
    .limit(100);
  const subs = subData ?? [];
  const subCreators = new Map<string, { handle: string | null; display_name: string | null }>();
  if (subs.length) {
    const { data: cs } = await supabase
      .from("creator_profiles")
      .select("id, handle, display_name")
      .in("id", subs.map((s) => s.user_id));
    (cs ?? []).forEach((c) => subCreators.set(c.id, { handle: c.handle, display_name: c.display_name }));
  }
  const submissions = subs.map((s) => ({
    ...s,
    handle: subCreators.get(s.user_id)?.handle ?? null,
    displayName: subCreators.get(s.user_id)?.display_name ?? null,
    selfieUrl: privateUrlFromRef(s.selfie_ref),
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

  const { data: brandData } = await supabase
    .from("brand_profiles")
    .select("id, company_name, rc_number, verification_submitted_at")
    .eq("verification_status", "pending")
    .order("verification_submitted_at", { ascending: true })
    .limit(100);
  const brands = brandData ?? [];

  return (
    <AdminShell role={role} active="verification">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Verification queue</h1>
      <p className="mt-1.5 text-sm text-ink-2">Creators who&apos;ve completed onboarding and are awaiting identity verification.</p>

      <h2 className="mt-7 font-display text-lg font-semibold text-ink">Identity submissions ({submissions.length})</h2>
      <p className="mt-0.5 text-sm text-ink-2">Manual review: check the selfie against the NIN, then approve or reject.</p>
      <div className="mt-4 grid gap-3">
        {submissions.length === 0 && (
          <Card variant="outline"><CardBody className="py-10 text-center text-ink-2">No photo/NIN submissions waiting.</CardBody></Card>
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
                    <p className="font-semibold text-ink">{s.displayName || `@${s.handle}`}</p>
                    <p className="text-xs text-ink-3">@{s.handle}</p>
                    <dl className="mt-2 grid gap-0.5 text-sm">
                      <div className="flex gap-2"><dt className="text-ink-3">NIN</dt><dd className="font-mono text-ink">{s.nin || "—"}</dd></div>
                      <div className="flex gap-2"><dt className="text-ink-3">Phone</dt><dd className="text-ink-2">{s.phone || "—"}</dd></div>
                      <div className="flex gap-2"><dt className="text-ink-3">Submitted</dt><dd className="text-ink-2">{s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "—"}</dd></div>
                    </dl>
                  </div>
                </div>
                <IdentitySubmissionRow creatorId={s.user_id} readonly={readonly} />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <h2 className="mt-10 font-display text-lg font-semibold text-ink">All awaiting identity ({rows.length})</h2>
      <div className="mt-4 grid gap-3">
        {rows.length === 0 && (
          <Card variant="outline"><CardBody className="py-12 text-center text-ink-2">Nobody waiting. 🎉</CardBody></Card>
        )}
        {rows.map((c) => (
          <Card key={c.id}>
            <CardBody>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{c.display_name || `@${c.handle}`}</p>
                  <p className="text-xs text-ink-3">@{c.handle} · {c.completeness}% complete</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <Flag on={!!c.bank_verified} label="Bank" />
                    <Flag on={!!c.identity_verified} label="Identity" />
                    <Flag on={!!c.is_live} label="Live" />
                  </div>
                </div>
                <VerificationRow id={c.id} identityVerified={!!c.identity_verified} isLive={!!c.is_live} readonly={readonly} />
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

      <h2 className="mt-10 font-display text-lg font-semibold text-ink">Brand verification ({brands.length})</h2>
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
                  <p className="font-semibold text-ink">{b.company_name || "Unnamed business"}</p>
                  <p className="text-xs text-ink-3">RC/CAC: {b.rc_number || "—"}{b.verification_submitted_at ? ` · submitted ${new Date(b.verification_submitted_at).toLocaleDateString()}` : ""}</p>
                </div>
                <BrandVerificationRow brandId={b.id} readonly={readonly} />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}

export default function AdminVerificationPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <VerificationInner />
    </Suspense>
  );
}
