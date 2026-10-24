import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardBody } from "@/components/ui/card";
import { EscrowControls, PayoutControls, RetryPayoutControls } from "@/components/admin/finance-controls";
import { requireSection, isReadonly } from "@/lib/admin/rbac";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin · Finance" };

type EscrowRow = { id: string; amount_naira: number; fee_naira: number; gig: { id: string; title: string } | null };
type PayoutRow = { id: string; amount_naira: number; status: string; gig: { title: string } | null; creator: { handle: string; display_name: string | null } | null };
type AuditRow = { id: string; action: string; target_type: string | null; target_id: string | null; created_at: string };

const AUDIT_LABEL: Record<string, string> = {
  "escrow.release": "Escrow released",
  "escrow.refund": "Escrow refunded",
  "payout.mark_paid": "Payout marked paid",
  "payout.retry": "Payout retried",
};

async function FinanceInner() {
  const { role } = await requireSection("finance");
  const supabase = await createClient();
  const readonly = isReadonly(role);

  const [{ data: escrow }, { data: payouts }, { data: failed }, { data: activity }] = await Promise.all([
    supabase.from("escrow_transactions").select("id, amount_naira, fee_naira, gig:gigs(id, title)").eq("status", "held").limit(100),
    supabase.from("payouts").select("id, amount_naira, status, gig:gigs(title), creator:creator_profiles(handle, display_name)").in("status", ["pending", "processing"]).limit(100),
    supabase.from("payouts").select("id, amount_naira, status, gig:gigs(title), creator:creator_profiles(handle, display_name)").eq("status", "failed").limit(100),
    supabase.from("audit_log").select("id, action, target_type, target_id, created_at").like("action", "escrow.%").order("created_at", { ascending: false }).limit(20),
  ]);

  const escrowRows = (escrow ?? []) as unknown as EscrowRow[];
  const payoutRows = (payouts ?? []) as unknown as PayoutRow[];
  const failedRows = (failed ?? []) as unknown as PayoutRow[];
  // Finance + payout activity (two prefixes), newest first.
  const { data: payoutActivity } = await supabase.from("audit_log").select("id, action, target_type, target_id, created_at").like("action", "payout.%").order("created_at", { ascending: false }).limit(20);
  const activityRows = [...((activity ?? []) as AuditRow[]), ...((payoutActivity ?? []) as AuditRow[])]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 20);

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

      {failedRows.length > 0 && (
        <>
          <h2 className="mt-8 font-display text-lg font-semibold text-error">Failed payouts — need attention ({failedRows.length})</h2>
          <div className="mt-3 grid gap-3">
            {failedRows.map((p) => (
              <Card key={p.id} variant="outline" className="border-error/30">
                <CardBody className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{p.creator?.display_name || (p.creator?.handle ? `@${p.creator.handle}` : "Creator")}</p>
                    <p className="text-xs text-ink-3">{formatNaira(p.amount_naira)} · {p.gig?.title ?? ""} · <span className="font-medium text-error">transfer failed</span></p>
                  </div>
                  <RetryPayoutControls payoutId={p.id} readonly={readonly} />
                </CardBody>
              </Card>
            ))}
          </div>
        </>
      )}

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">Recent finance activity</h2>
      <Card className="mt-3">
        <CardBody className="p-0">
          {activityRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-3">No finance actions logged yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {activityRows.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="text-ink">{AUDIT_LABEL[a.action] ?? a.action}</span>
                  <span className="text-xs text-ink-3">{new Date(a.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
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
