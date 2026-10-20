import type { Metadata } from "next";
import { Suspense } from "react";
import { Check, X } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardBody } from "@/components/ui/card";
import { VerificationRow } from "@/components/admin/verification-row";
import { BrandVerificationRow } from "@/components/admin/brand-verification-row";
import { requireSection, isReadonly } from "@/lib/admin/rbac";
import { createClient } from "@/lib/supabase/server";

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

      <div className="mt-6 grid gap-3">
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
