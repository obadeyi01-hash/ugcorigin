import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardBody } from "@/components/ui/card";
import { BoostCancelButton } from "@/components/admin/boost-cancel-button";
import { requireSection, isReadonly } from "@/lib/admin/rbac";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin · Boosts" };

type Boost = {
  id: string;
  target_type: "creator" | "brief" | "campaign";
  target_id: string;
  days: number;
  amount_naira: number;
  status: "pending" | "active" | "cancelled";
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

const STATUS_STYLE: Record<string, string> = {
  active: "bg-success/12 text-success",
  pending: "bg-warning/14 text-warning",
  cancelled: "bg-surface-2 text-ink-3",
};

function targetHref(b: Boost, handle?: string | null) {
  if (b.target_type === "creator") return handle ? `/${handle}` : null;
  if (b.target_type === "brief") return `/briefs/${b.target_id}`;
  return `/campaigns/${b.target_id}`;
}

function isLiveNow(b: Boost) {
  return b.status === "active" && b.ends_at != null && new Date(b.ends_at).getTime() > Date.now();
}

async function BoostsInner() {
  const { role } = await requireSection("boosts");
  const readonly = isReadonly(role);
  const supabase = await createClient();

  const { data: boostsRaw } = await supabase
    .from("boosts")
    .select("id, target_type, target_id, days, amount_naira, status, starts_at, ends_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const boosts = (boostsRaw ?? []) as Boost[];

  // Resolve creator handles for nicer links.
  const creatorIds = boosts.filter((b) => b.target_type === "creator").map((b) => b.target_id);
  const handles = new Map<string, string>();
  if (creatorIds.length) {
    const { data: cs } = await supabase.from("creator_profiles").select("id, handle").in("id", creatorIds);
    (cs ?? []).forEach((c) => c.handle && handles.set(c.id, c.handle));
  }

  const revenue = boosts.filter((b) => b.status !== "pending").reduce((s, b) => s + b.amount_naira, 0);
  const liveCount = boosts.filter(isLiveNow).length;

  return (
    <AdminShell role={role} active="boosts">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Boosts</h1>
      <p className="mt-1 text-sm text-ink-2">Paid featured placements. Boosts add a capped, labelled band only, they never change ranking or tier.</p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card><CardBody><p className="text-xs text-ink-3">Live now</p><p className="mt-1 font-display text-2xl font-bold text-ink">{liveCount}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs text-ink-3">Boosts (90d)</p><p className="mt-1 font-display text-2xl font-bold text-ink">{boosts.length}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs text-ink-3">Boost revenue</p><p className="mt-1 font-display text-2xl font-bold text-ink">{formatNaira(revenue)}</p></CardBody></Card>
      </div>

      <Card className="mt-6">
        <CardBody className="p-0">
          <ul className="divide-y divide-line">
            {boosts.map((b) => {
              const href = targetHref(b, handles.get(b.target_id));
              const live = isLiveNow(b);
              return (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium capitalize text-ink-2">{b.target_type}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[b.status]}`}>{b.status}</span>
                      {href ? (
                        <Link href={href} className="truncate text-sm font-medium text-ink hover:text-accent">
                          {b.target_type === "creator" && handles.get(b.target_id) ? `@${handles.get(b.target_id)}` : b.target_id.slice(0, 8)}
                        </Link>
                      ) : (
                        <span className="truncate text-sm font-medium text-ink">{b.target_id.slice(0, 8)}</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-ink-3">
                      {formatNaira(b.amount_naira)} · {b.days}d ·{" "}
                      {b.ends_at ? (live ? `ends ${new Date(b.ends_at).toLocaleDateString()}` : `ended ${new Date(b.ends_at).toLocaleDateString()}`) : "awaiting payment"}
                    </p>
                  </div>
                  {!readonly && (b.status === "active" || b.status === "pending") && <BoostCancelButton boostId={b.id} />}
                </li>
              );
            })}
            {boosts.length === 0 && <li className="p-6 text-center text-sm text-ink-3">No boosts yet.</li>}
          </ul>
        </CardBody>
      </Card>
    </AdminShell>
  );
}

export default function AdminBoostsPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <BoostsInner />
    </Suspense>
  );
}
