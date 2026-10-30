import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardBody } from "@/components/ui/card";
import { EscrowControls, PayoutControls, RetryPayoutControls, ReleaseApprovalControls } from "@/components/admin/finance-controls";
import { requireSection, isReadonly } from "@/lib/admin/rbac";
import { dualControlThresholdNaira } from "@/lib/admin/security";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/utils";
import { loadTaxBps } from "@/lib/fees-server";
import { taxPercentLabel } from "@/lib/fees";
import { TaxRateControl, TransactionTaxControl } from "@/components/admin/tax-controls";
import { AdminListControls } from "@/components/admin/list-controls";
import { pageCount, pageWindow, readPage } from "@/lib/admin/list";

export const metadata: Metadata = { title: "Admin · Finance" };

type EscrowRow = { id: string; amount_naira: number; fee_naira: number; tax_naira: number; gig: { id: string; title: string } | null };
type PayoutRow = { id: string; amount_naira: number; status: string; gig: { title: string } | null; creator: { handle: string; display_name: string | null } | null };
type AuditRow = { id: string; action: string; target_type: string | null; target_id: string | null; created_at: string };
type ApprovalRow = { id: string; kind: "release" | "refund"; amount_naira: number; requested_by: string | null; created_at: string; gig: { title: string } | null };

const AUDIT_LABEL: Record<string, string> = {
  "escrow.release": "Payment released",
  "escrow.refund": "Payment refunded",
  "escrow.release_requested": "Release submitted for approval",
  "escrow.refund_requested": "Refund submitted for approval",
  "escrow.release_approved": "Release approved (2nd admin)",
  "escrow.refund_approved": "Refund approved (2nd admin)",
  "escrow.release_rejected": "Release request rejected",
  "escrow.refund_rejected": "Refund request rejected",
  "payout.mark_paid": "Payout marked paid",
  "payout.retry": "Payout retried",
};

async function FinanceInner({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { role, userId } = await requireSection("finance");
  const supabase = await createClient();
  const readonly = isReadonly(role);
  const sp = await searchParams;
  const epage = readPage(sp.epage);
  const ppage = readPage(sp.ppage);
  const fpage = readPage(sp.fpage);
  const escrowWindow = pageWindow(epage);
  const payoutWindow = pageWindow(ppage);
  const failedWindow = pageWindow(fpage);

  const escrowQuery = supabase.from("escrow_transactions").select("id, amount_naira, fee_naira, tax_naira, gig:gigs(id, title)", { count: "exact" }).eq("status", "held");
  const payoutQuery = supabase.from("payouts").select("id, amount_naira, status, gig:gigs(title), creator:creator_profiles(handle, display_name)", { count: "exact" }).in("status", ["pending", "processing"]);
  const failedQuery = supabase.from("payouts").select("id, amount_naira, status, gig:gigs(title), creator:creator_profiles(handle, display_name)", { count: "exact" }).eq("status", "failed");

  const [{ data: escrow, count: escrowCount }, { data: payouts, count: payoutCount }, { data: failed, count: failedCount }, { data: activity }, { data: approvals }] = await Promise.all([
    escrowQuery.range(escrowWindow.from, escrowWindow.to),
    payoutQuery.order("created_at", { ascending: false }).range(payoutWindow.from, payoutWindow.to),
    failedQuery.order("created_at", { ascending: false }).range(failedWindow.from, failedWindow.to),
    supabase.from("audit_log").select("id, action, target_type, target_id, created_at").like("action", "escrow.%").order("created_at", { ascending: false }).limit(20),
    supabase.from("release_approvals").select("id, kind, amount_naira, requested_by, created_at, gig:gigs(title)").eq("status", "pending").order("created_at", { ascending: false }).limit(50),
  ]);

  const taxBps = await loadTaxBps();
  const escrowRows = (escrow ?? []) as unknown as EscrowRow[];
  const payoutRows = (payouts ?? []) as unknown as PayoutRow[];
  const failedRows = (failed ?? []) as unknown as PayoutRow[];
  const approvalRows = (approvals ?? []) as unknown as ApprovalRow[];
  // Finance + payout activity (two prefixes), newest first.
  const { data: payoutActivity } = await supabase.from("audit_log").select("id, action, target_type, target_id, created_at").like("action", "payout.%").order("created_at", { ascending: false }).limit(20);
  const activityRows = [...((activity ?? []) as AuditRow[]), ...((payoutActivity ?? []) as AuditRow[])]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 20);

  return (
    <AdminShell role={role} active="finance">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Finance</h1>
      <p className="mt-1 text-sm text-ink-3">
        Releases and refunds of {formatNaira(dualControlThresholdNaira())} or more need a second admin to approve before the money moves.
      </p>
      <TaxRateControl percent={Number(taxPercentLabel(taxBps).replace("%", ""))} readonly={readonly} />

      {approvalRows.length > 0 && (
        <>
          <h2 className="mt-6 font-display text-lg font-semibold text-accent">Pending approvals ({approvalRows.length})</h2>
          <div className="mt-3 grid gap-3">
            {approvalRows.map((a) => (
              <Card key={a.id} variant="outline" className="border-accent/30 bg-accent-tint/30">
                <CardBody className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">
                      <span className="capitalize">{a.kind}</span> · {formatNaira(a.amount_naira)}
                    </p>
                    <p className="text-xs text-ink-3">
                      {a.gig?.title ?? "Gig"} · requested {new Date(a.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  <ReleaseApprovalControls approvalId={a.id} isRequester={a.requested_by === userId} readonly={readonly} />
                </CardBody>
              </Card>
            ))}
          </div>
        </>
      )}

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">Funds held</h2>
      <AdminListControls
        pathname="/admin/finance"
        q=""
        search={false}
        placeholder="Gig title"
        pageParam="epage"
        page={Math.min(epage, pageCount(escrowCount))}
        pages={pageCount(escrowCount)}
        total={escrowCount ?? 0}
        hidden={{ ppage: ppage > 1 ? String(ppage) : undefined, fpage: fpage > 1 ? String(fpage) : undefined }}
      />
      <div className="mt-3 grid gap-3">
        {escrowRows.length === 0 && <Card variant="outline"><CardBody className="py-10 text-center text-ink-2">No funds currently held.</CardBody></Card>}
        {escrowRows.map((e) => (
          <Card key={e.id}>
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-ink">{e.gig?.title ?? "Gig"}</p>
                <p className="text-xs text-ink-3">{formatNaira(e.amount_naira)} held · {formatNaira(e.fee_naira)} fee · {formatNaira(e.tax_naira ?? 0)} tax</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {e.gig && <TransactionTaxControl gigId={e.gig.id} taxNaira={e.tax_naira ?? 0} readonly={readonly} />}
                {e.gig && <EscrowControls gigId={e.gig.id} readonly={readonly} />}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">Payouts to process</h2>
      <AdminListControls
        pathname="/admin/finance"
        q=""
        search={false}
        placeholder="Creator"
        pageParam="ppage"
        page={Math.min(ppage, pageCount(payoutCount))}
        pages={pageCount(payoutCount)}
        total={payoutCount ?? 0}
        hidden={{ epage: epage > 1 ? String(epage) : undefined, fpage: fpage > 1 ? String(fpage) : undefined }}
      />
      <div className="mt-3 grid gap-3">
        {payoutRows.length === 0 && <Card variant="outline"><CardBody className="py-10 text-center text-ink-2">No pending payouts.</CardBody></Card>}
        {payoutRows.map((p) => (
          <Card key={p.id}>
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-ink">{p.creator?.display_name || (p.creator?.handle ? `@${p.creator.handle}` : "Creator")}</p>
                <p className="text-xs text-ink-3">{formatNaira(p.amount_naira)} · {p.gig?.title || "Creator referral"} · <span className="capitalize">{p.status}</span></p>
              </div>
              <PayoutControls payoutId={p.id} readonly={readonly} />
            </CardBody>
          </Card>
        ))}
      </div>

      {failedRows.length > 0 && (
        <>
          <h2 className="mt-8 font-display text-lg font-semibold text-error">Failed payouts, need attention</h2>
          <AdminListControls
            pathname="/admin/finance"
            q=""
            search={false}
            placeholder="Creator"
            pageParam="fpage"
            page={Math.min(fpage, pageCount(failedCount))}
            pages={pageCount(failedCount)}
            total={failedCount ?? 0}
            hidden={{ epage: epage > 1 ? String(epage) : undefined, ppage: ppage > 1 ? String(ppage) : undefined }}
          />
          <div className="mt-3 grid gap-3">
            {failedRows.map((p) => (
              <Card key={p.id} variant="outline" className="border-error/30">
                <CardBody className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{p.creator?.display_name || (p.creator?.handle ? `@${p.creator.handle}` : "Creator")}</p>
                    <p className="text-xs text-ink-3">{formatNaira(p.amount_naira)} · {p.gig?.title || "Creator referral"} · <span className="font-medium text-error">transfer failed</span></p>
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

export default function AdminFinancePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <FinanceInner searchParams={searchParams} />
    </Suspense>
  );
}
