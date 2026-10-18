import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardBody } from "@/components/ui/card";
import { requireSection } from "@/lib/admin/rbac";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin · Gigs" };

async function GigsInner() {
  const { role } = await requireSection("gigs");
  const supabase = await createClient();

  const { data: gigs } = await supabase
    .from("gigs")
    .select("id, title, status, price_naira, fee_naira, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <AdminShell role={role} active="gigs">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Gigs</h1>
      <Card className="mt-6">
        <CardBody className="p-0">
          <ul className="divide-y divide-line">
            {(gigs ?? []).map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-3 p-4">
                <Link href={`/gigs/${g.id}`} className="min-w-0 truncate font-medium text-ink hover:text-accent">{g.title}</Link>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm text-ink-2">{formatNaira(g.price_naira)}</span>
                  <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium capitalize text-ink-2">{g.status.replace("_", " ")}</span>
                </div>
              </li>
            ))}
            {(!gigs || gigs.length === 0) && <li className="p-6 text-center text-sm text-ink-3">No gigs yet.</li>}
          </ul>
        </CardBody>
      </Card>
    </AdminShell>
  );
}

export default function AdminGigsPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <GigsInner />
    </Suspense>
  );
}
