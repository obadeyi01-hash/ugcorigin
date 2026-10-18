import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardBody } from "@/components/ui/card";
import { TierBadge } from "@/components/ui/tier-badge";
import { TierConfigEditor } from "@/components/admin/tier-config-editor";
import { CreatorTierControls } from "@/components/admin/creator-tier-controls";
import { requireSection, isReadonly } from "@/lib/admin/rbac";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/utils";
import { tierMeta } from "@/lib/tiers";

export const metadata: Metadata = { title: "Admin · Tiers" };

type ConfigRow = { tier: string; rank: number; label: string; tagline: string; floor_naira: number };
type CreatorRow = {
  id: string;
  handle: string | null;
  display_name: string | null;
  tier: string;
  is_live: boolean;
  starting_rate_naira: number | null;
  earned_reputation: number | null;
  metrics: { gigs_completed: number; review_count: number; avg_rating: number | null } | null;
};

async function TiersInner() {
  const { role } = await requireSection("tiers");
  const readonly = isReadonly(role);
  const supabase = await createClient();

  const [{ data: configRaw }, { data: creatorsRaw }] = await Promise.all([
    supabase.from("tier_config").select("tier, rank, label, tagline, floor_naira").order("rank", { ascending: true }),
    supabase
      .from("creator_profiles")
      .select(
        "id, handle, display_name, tier, is_live, starting_rate_naira, earned_reputation, metrics:creator_metrics(gigs_completed, review_count, avg_rating)",
      )
      .order("earned_reputation", { ascending: false })
      .limit(80),
  ]);

  const config = (configRaw ?? []) as ConfigRow[];
  const creators = (creatorsRaw ?? []) as unknown as CreatorRow[];

  return (
    <AdminShell role={role} active="tiers">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Tiers</h1>
      <p className="mt-1 text-sm text-ink-2">
        The ladder, price floors and creator standings. Changes are audited. Tiers move one step at a time, overrides here
        are manual exceptions.
      </p>

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">Tier configuration</h2>
      <p className="mt-0.5 text-sm text-ink-3">Edit labels, taglines and the price floor for each rung.</p>
      <div className="mt-3">
        <TierConfigEditor rows={config} readonly={readonly} />
      </div>

      <h2 className="mt-10 font-display text-lg font-semibold text-ink">Creators ({creators.length})</h2>
      <p className="mt-0.5 text-sm text-ink-3">Ranked by earned reputation. Adjust a tier or re-run the scoring engine.</p>
      <Card className="mt-3">
        <CardBody className="p-0">
          <ul className="divide-y divide-line">
            {creators.map((c) => {
              const m = c.metrics;
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/${c.handle}`} className="font-medium text-ink hover:text-accent">
                        {c.display_name || `@${c.handle}`}
                      </Link>
                      <TierBadge tier={c.tier} />
                      {!c.is_live && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-ink-3">Not live</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-ink-3">
                      ERS {Number(c.earned_reputation ?? 0).toFixed(0)} · {m?.gigs_completed ?? 0} gigs ·{" "}
                      {m?.review_count ? `${Number(m.avg_rating ?? 0).toFixed(1)}★ (${m.review_count})` : "no reviews"} ·
                      floor {formatNaira(tierMeta(c.tier).floorNaira)}
                      {c.starting_rate_naira ? ` · rate ${formatNaira(c.starting_rate_naira)}` : ""}
                    </p>
                  </div>
                  <CreatorTierControls creatorId={c.id} currentTier={c.tier} readonly={readonly} />
                </li>
              );
            })}
            {creators.length === 0 && <li className="p-6 text-center text-sm text-ink-3">No creators yet.</li>}
          </ul>
        </CardBody>
      </Card>
    </AdminShell>
  );
}

export default function AdminTiersPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <TiersInner />
    </Suspense>
  );
}
