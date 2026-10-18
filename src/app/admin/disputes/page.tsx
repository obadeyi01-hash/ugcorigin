import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardBody } from "@/components/ui/card";
import { ResolveDispute } from "@/components/admin/resolve-dispute";
import { requireSection, isReadonly } from "@/lib/admin/rbac";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin · Disputes" };

type DisputeRow = { id: string; reason: string | null; status: string; gig: { id: string; title: string; price_naira: number } | null };

async function DisputesInner() {
  const { role } = await requireSection("disputes");
  const supabase = await createClient();
  const readonly = isReadonly(role);

  const { data } = await supabase
    .from("disputes")
    .select("id, reason, status, gig:gigs(id, title, price_naira)")
    .eq("status", "open")
    .order("created_at", { ascending: true });

  const disputes = (data ?? []) as unknown as DisputeRow[];

  return (
    <AdminShell role={role} active="disputes">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Disputes</h1>
      <p className="mt-1.5 text-sm text-ink-2">Resolve against the written brief: release, refund, or split the escrow.</p>

      <div className="mt-6 grid gap-4">
        {disputes.length === 0 && <Card variant="outline"><CardBody className="py-14 text-center text-ink-2">No open disputes. 🎉</CardBody></Card>}
        {disputes.map((d) => (
          <Card key={d.id}>
            <CardBody>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/gigs/${d.gig?.id}`} className="font-display font-semibold text-ink hover:text-accent">{d.gig?.title ?? "Gig"}</Link>
                  <p className="text-xs text-ink-3">{d.gig ? formatNaira(d.gig.price_naira) : ""} in escrow</p>
                </div>
                <span className="rounded-full bg-error/12 px-2.5 py-0.5 text-xs font-medium text-error">Open</span>
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

export default function AdminDisputesPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <DisputesInner />
    </Suspense>
  );
}
