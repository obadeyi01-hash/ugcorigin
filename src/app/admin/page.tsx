import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireSection } from "@/lib/admin/rbac";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin" };

async function count(q: PromiseLike<{ count: number | null }>) {
  const { count: c } = await q;
  return c ?? 0;
}

async function OverviewInner() {
  const { role } = await requireSection("overview");
  const supabase = await createClient();

  const cp = () => supabase.from("creator_profiles").select("id", { count: "exact", head: true });
  const gq = () => supabase.from("gigs").select("id", { count: "exact", head: true });

  const [creators, liveCreators, pendingVerify, brands, gigs, openDisputes, heldRows] = await Promise.all([
    count(cp()),
    count(cp().eq("is_live", true)),
    count(cp().eq("identity_verified", false).gt("completeness", 0)),
    count(supabase.from("brand_profiles").select("id", { count: "exact", head: true })),
    count(gq()),
    count(supabase.from("disputes").select("id", { count: "exact", head: true }).eq("status", "open")),
    supabase.from("escrow_transactions").select("amount_naira").eq("status", "held").limit(1000),
  ]);

  const escrowHeld = (heldRows.data ?? []).reduce((s, r) => s + (r.amount_naira ?? 0), 0);

  const tiles = [
    { label: "Creators", value: creators },
    { label: "Live creators", value: liveCreators },
    { label: "Pending verification", value: pendingVerify },
    { label: "Brands", value: brands },
    { label: "Gigs", value: gigs },
    { label: "Open disputes", value: openDisputes },
    { label: "Funds held", value: formatNaira(escrowHeld) },
  ];

  return (
    <AdminShell role={role} active="overview">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Overview</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-line bg-surface p-5">
            <p className="font-display text-3xl font-bold text-ink">{t.value}</p>
            <p className="mt-1 text-sm text-ink-2">{t.label}</p>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

export default function AdminOverviewPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <OverviewInner />
    </Suspense>
  );
}
