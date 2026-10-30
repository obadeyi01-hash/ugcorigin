import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminShellSkeleton } from "@/components/admin/admin-shell-skeleton";
import { Card, CardBody } from "@/components/ui/card";
import { AdminListControls } from "@/components/admin/list-controls";
import { requireSection } from "@/lib/admin/rbac";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/utils";
import { pageCount, pageWindow, readPage, readQuery } from "@/lib/admin/list";

export const metadata: Metadata = { title: "Admin · Gigs" };

const GIG_STATUS = [
  { value: "all", label: "All" },
  { value: "pending_acceptance", label: "Pending acceptance" },
  { value: "funded", label: "Funded" },
  { value: "in_progress", label: "In progress" },
  { value: "in_review", label: "In review" },
  { value: "revision", label: "Revision" },
  { value: "approved", label: "Approved" },
  { value: "released", label: "Released" },
  { value: "completed", label: "Completed" },
  { value: "disputed", label: "Disputed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "declined", label: "Declined" },
];

async function GigsInner({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { role } = await requireSection("gigs");
  const supabase = await createClient();
  const sp = await searchParams;
  const q = readQuery(sp.q);
  const status = GIG_STATUS.some((item) => item.value === sp.status) ? sp.status! : "all";
  const page = readPage(sp.page);
  const window = pageWindow(page);
  let query = supabase.from("gigs").select("id, title, status, price_naira, fee_naira, created_at", { count: "exact" }).order("created_at", { ascending: false });
  if (q) query = query.ilike("title", `%${q}%`);
  if (status !== "all") query = query.eq("status", status);
  const { data: gigs, count } = await query.range(window.from, window.to);
  const pages = pageCount(count);

  return (
    <AdminShell role={role} active="gigs">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Gigs</h1>
      <AdminListControls
        pathname="/admin/gigs"
        q={q}
        placeholder="Gig title"
        filters={[{ name: "status", label: "Status", value: status, options: GIG_STATUS }]}
        page={Math.min(page, pages)}
        pages={pages}
        total={count ?? 0}
      />
      <Card className="mt-4">
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

export default function AdminGigsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return (
    <Suspense fallback={<AdminShellSkeleton />}>
      <GigsInner searchParams={searchParams} />
    </Suspense>
  );
}
