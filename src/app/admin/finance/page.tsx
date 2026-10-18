import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardBody } from "@/components/ui/card";
import { EscrowControls, PayoutControls } from "@/components/admin/finance-controls";
import { requireSection, isReadonly } from "@/lib/admin/rbac";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin · Finance" };

type EscrowRow = { id: string; amount_naira: number; fee_naira: number; gig: { id: string; title: string } | null };
type PayoutRow = { id: string; amount_naira: number; status: string; gig: { title: string } | null; creator: { handle: string; display_name: string | null } | null };

async function FinanceInner() {
  const { role } = await requireSection("finance");
  const supabase = await createClient();
  const readonly = isReadonly(role);

  const [{ data: escrow }, { data: payouts }] = await Promise.all([
    supabase.from("escrow_transactions").select("id, amount_naira, fee_naira, gig:gigs(id, title)").eq("status", "held").limit(100),
    supabase.from("payouts").select("id, amount_naira, status, gig:gigs(title), creator:creator_profiles(handle, display_name)").in("status", ["pending", "processing"]).limit(100),
  ]);

  const escrowRows = (escrow ?? []) as unknown as EscrowRow[];
  const payoutRows = (payouts ?? []) as unknown as PayoutRow[];

  return (
    <AdminShell role={role} active="finance">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Finance</h1>

      <h2 className="mt-6 font-display text-lg font-semibold text-ink">Escrow held ({escrowRows.length})</h2>
      <div className="mt-3 grid gap-3">
        {escrowRows.length === 0 && <Card variant="outline"><CardBody className="py-10 text-center text-ink-2">No escrow currently held.</CardBody></Card>}
        {escrowRows.map((e) => (
          <Card key={e.id}>
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-ink">{e.gig?.title ?? "Gig"}</p>
                <p className="text-xs text-ink-3">{formatNaira(e.amount_naira)} held · {formatNaira(e.fee_naira)} fee</p>
              </div>
              {e.gig && <EscrowControls gigId={e.gig.id} readonly={readonly} />}
            </CardBody>
          </Card>
        ))}
      </div>

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">Payouts to process ({payoutRows.length})</h2>
      <div className="mt-3 grid gap-3">
        {payoutRows.length === 0 && <Card variant="outline"><CardBody className="py-10 text-center text-ink-2">No pending payouts.</CardBody></Card>}
        {payoutRows.map((p) => (
          <Card key={p.id}>
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-ink">{p.creator?.display_name || (p.creator?.handle ? `@${p.creator.handle}` : "Creator")}</p>
                <p className="text-xs text-ink-3">{formatNaira(p.amount_naira)} · {p.gig?.title ?? ""} · <span className="capitalize">{p.status}</span></p>
              </div>
              <PayoutControls payoutId={p.id} readonly={readonly} />
            </CardBody>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}

export default function AdminFinancePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <FinanceInner />
    </Suspense>
  );
}
