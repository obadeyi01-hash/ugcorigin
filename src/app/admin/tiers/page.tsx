import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminShellSkeleton } from "@/components/admin/admin-shell-skeleton";
import { Card, CardBody } from "@/components/ui/card";
import { TierBadge } from "@/components/ui/tier-badge";
import { TierConfigEditor } from "@/components/admin/tier-config-editor";
import { RateGuideEditor } from "@/components/admin/rate-guide-editor";
import { createAdminClient } from "@/lib/supabase/admin";
import { FALLBACK_GUIDES, isRateTier, type RateGuide } from "@/lib/rates/guides";
import { TIERS } from "@/lib/tiers";
import { CreatorTierControls } from "@/components/admin/creator-tier-controls";
import { requireSection, isReadonly } from "@/lib/admin/rbac";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/utils";
import { AdminListControls } from "@/components/admin/list-controls";
import { pageCount, pageWindow, readPage, readQuery } from "@/lib/admin/list";

export const metadata: Metadata = { title: "Admin · Tiers" };

type ConfigRow = { tier: string; rank: number; label: string; tagline: string; floor_naira: number };
type CreatorRow = {
  id: string;
  handle: string | null;
  display_name: string | null;
  tier: string;
  is_live: boolean;
  is_influencer: boolean;
  starting_rate_naira: number | null;
  earned_reputation: number | null;
  metrics: { gigs_completed: number; review_count: number; avg_rating: number | null } | null;
};

async function TiersInner({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { role } = await requireSection("tiers");
  const readonly = isReadonly(role);
  const supabase = await createClient();
  const sp = await searchParams;
  const q = readQuery(sp.q);
  const tierFilter = TIERS.some((tier) => tier.key === sp.tier) ? sp.tier! : "all";
  const page = readPage(sp.page);
  const window = pageWindow(page);
  let creatorsQuery = supabase
    .from("creator_profiles")
    .select(
      "id, handle, display_name, tier, is_live, is_influencer, starting_rate_naira, earned_reputation, metrics:creator_metrics(gigs_completed, review_count, avg_rating)",
      { count: "exact" },
    )
    .order("earned_reputation", { ascending: false });
  if (q) creatorsQuery = creatorsQuery.or(`display_name.ilike.%${q}%,handle.ilike.%${q}%`);
  if (tierFilter !== "all") creatorsQuery = creatorsQuery.eq("tier", tierFilter);

  const [{ data: configRaw }, { data: creatorsRaw, count: creatorCount }] = await Promise.all([
    supabase.from("tier_config").select("tier, rank, label, tagline, floor_naira").order("rank", { ascending: true }),
    creatorsQuery.range(window.from, window.to),
  ]);

  const config = (configRaw ?? []) as ConfigRow[];
  const creators = (creatorsRaw ?? []) as unknown as CreatorRow[];
  const admin = createAdminClient();
  const { data: guideRaw } = await admin
    .from("rate_guides")
    .select("tier, niche, location, low_naira, typical_naira, high_naira")
    .order("tier", { ascending: true })
    .order("location", { ascending: true })
    .order("niche", { ascending: true });
  const guides: RateGuide[] = guideRaw?.length
    ? guideRaw.flatMap((row) => isRateTier(row.tier) ? [{ tier: row.tier, niche: row.niche, location: row.location, low: row.low_naira, typical: row.typical_naira, high: row.high_naira }] : [])
    : FALLBACK_GUIDES;

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

      <h2 className="mt-10 font-display text-lg font-semibold text-ink">Suggested starting rates</h2>
      <p className="mt-0.5 max-w-2xl text-sm text-ink-3">
        One band per tier, niche and state. A new creator is Origin, so onboarding suggests the Origin number. Rising and Pro are higher because those levels are earned. Lagos and Abuja sit a step above the rest of the country.
      </p>
      <div className="mt-3">
        <RateGuideEditor rows={guides} readonly={readonly} />
      </div>

      <h2 className="mt-10 font-display text-lg font-semibold text-ink">Creators</h2>
      <AdminListControls
        pathname="/admin/tiers"
        q={q}
        placeholder="Name or username"
        filters={[{ name: "tier", label: "Level", value: tierFilter, options: [{ value: "all", label: "All levels" }, ...TIERS.map((tier) => ({ value: tier.key, label: tier.label }))] }]}
        page={Math.min(page, pageCount(creatorCount))}
        pages={pageCount(creatorCount)}
        total={creatorCount ?? 0}
      />
      <p className="mt-0.5 text-sm text-ink-3">Grouped by tier, from Luminary down to Origin. Reputation only orders people inside the same tier.</p>
      {creators.length === 0 && <Card className="mt-3"><CardBody className="p-6 text-center text-sm text-ink-3">No creators yet.</CardBody></Card>}
      {[...TIERS].reverse().map((tier) => {
        const group = creators
          .filter((c) => c.tier === tier.key)
          .sort((a, b) => Number(b.earned_reputation ?? 0) - Number(a.earned_reputation ?? 0));
        if (group.length === 0) return null;
        return (
          <div key={tier.key} className="mt-6">
            <h3 className="font-display text-base font-semibold text-ink">{tier.label}</h3>
            <p className="text-xs text-ink-3">{tier.tagline} Floor {formatNaira(tier.floorNaira)}.</p>
            <Card className="mt-2">
              <CardBody className="p-0">
                <ul className="divide-y divide-line">
                  {group.map((c) => {
                    const m = c.metrics;
                    return (
                      <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link href={`/${c.handle}`} className="font-medium text-ink hover:text-accent">
                              {c.display_name || `@${c.handle}`}
                            </Link>
                            <TierBadge tier={c.tier} />
                            {!c.is_live && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-2xs text-ink-3">Not live</span>}
                          </div>
                          <p className="mt-0.5 text-xs text-ink-3">
                            {m?.gigs_completed ?? 0} gigs · {m?.review_count ? `${Number(m.avg_rating ?? 0).toFixed(1)}★ (${m.review_count})` : "no reviews"}
                            {c.starting_rate_naira ? ` · rate ${formatNaira(c.starting_rate_naira)}` : ""}
                          </p>
                        </div>
                        <CreatorTierControls creatorId={c.id} currentTier={c.tier} isInfluencer={c.is_influencer} readonly={readonly} />
                      </li>
                    );
                  })}
                </ul>
              </CardBody>
            </Card>
          </div>
        );
      })}
    </AdminShell>
  );
}

export default function AdminTiersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return (
    <Suspense fallback={<AdminShellSkeleton />}>
      <TiersInner searchParams={searchParams} />
    </Suspense>
  );
}
