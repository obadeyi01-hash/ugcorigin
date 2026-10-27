import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardBody } from "@/components/ui/card";
import { ResolveDispute } from "@/components/admin/resolve-dispute";
import { AdminListControls } from "@/components/admin/list-controls";
import { requireSection, isReadonly } from "@/lib/admin/rbac";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/utils";
import { pageCount, pageWindow, readPage, readQuery } from "@/lib/admin/list";

export const metadata: Metadata = { title: "Admin · Disputes" };

type DisputeRow = { id: string; reason: string | null; status: string; gig: { id: string; title: string; price_naira: number } | null };

const DISPUTE_STATUS = [
  { value: "open", label: "Open" },
  { value: "under_review", label: "Under review" },
  { value: "resolved_release", label: "Resolved, release" },
  { value: "resolved_refund", label: "Resolved, refund" },
  { value: "resolved_partial", label: "Resolved, partial" },
  { value: "all", label: "All" },
];

async function DisputesInner({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { role } = await requireSection("disputes");
  const supabase = await createClient();
  const readonly = isReadonly(role);
  const sp = await searchParams;
  const q = readQuery(sp.q);
  const status = DISPUTE_STATUS.some((item) => item.value === sp.status) ? sp.status! : "open";
  const page = readPage(sp.page);
  const window = pageWindow(page);
  let query = supabase
    .from("disputes")
    .select("id, reason, status, gig:gigs(id, title, price_naira)", { count: "exact" })
    .order("created_at", { ascending: true });
  if (status !== "all") query = query.eq("status", status);
  if (q) query = query.ilike("reason", `%${q}%`);
  const { data, count } = await query.range(window.from, window.to);
  const pages = pageCount(count);

  const disputes = (data ?? []) as unknown as DisputeRow[];

  return (
    <AdminShell role={role} active="disputes">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Disputes</h1>
      <p className="mt-1.5 text-sm text-ink-2">Resolve against the written brief: release, refund, or split the escrow.</p>
      <AdminListControls
        pathname="/admin/disputes"
        q={q}
        placeholder="Reason"
        filters={[{ name: "status", label: "Status", value: status, options: DISPUTE_STATUS }]}
        page={Math.min(page, pages)}
        pages={pages}
        total={count ?? 0}
      />

      <div className="mt-6 grid gap-4">
        {disputes.length === 0 && <Card variant="outline"><CardBody className="py-14 text-center text-ink-2">No disputes match this filter.</CardBody></Card>}
        {disputes.map((d) => (
          <Card key={d.id}>
            <CardBody>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/gigs/${d.gig?.id}`} className="font-display font-semibold text-ink hover:text-accent">{d.gig?.title ?? "Gig"}</Link>
                  <p className="text-xs text-ink-3">{d.gig ? formatNaira(d.gig.price_naira) : ""} in escrow</p>
                </div>
                <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium capitalize text-ink-2">{d.status.replace(/_/g, " ")}</span>
              </div>
              {d.reason && <p className="mt-3 text-sm text-ink-2">{d.reason}</p>}
              {d.gig && !readonly && <ResolveDispute disputeId={d.id} price={d.gig.price_naira} />}
              {readonly && <p className="mt-3 text-xs text-ink-3">Read-only role.</p>}
            </CardBody>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}

export default function AdminDisputesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <DisputesInner searchParams={searchParams} />
    </Suspense>
  );
}
