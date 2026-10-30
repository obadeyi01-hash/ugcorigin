import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { PillRow } from "@/components/ui/pill-row";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Card, CardBody } from "@/components/ui/card";
import { SubmissionsList, type Submission } from "@/components/campaigns/submissions-list";
import { CampaignSubmit } from "@/components/campaigns/campaign-submit";
import { FundPool } from "@/components/campaigns/fund-pool";
import { BoostButton } from "@/components/boost/boost-button";
import { BrandByline } from "@/components/briefs/brief-facts";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/role";
import { formatNaira } from "@/lib/utils";
import { feeFor, taxFor, taxPercentLabel } from "@/lib/fees";
import { loadTaxBps } from "@/lib/fees-server";
import { Notice } from "@/components/ui/notice";

export const metadata: Metadata = { title: "Campaign" };

async function Inner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return <div className="py-20 text-center text-ink-2">Connect Supabase to view campaigns.</div>;
  const supabase = await createClient();

  const { data: c } = await supabase
    .from("campaigns")
    .select("id, brand_id, title, description, niches, pool_naira, spent_naira, rate_per_1000_naira, funded, status, conceal_brand, brand:brand_profiles(company_name)")
    .eq("id", id)
    .maybeSingle();
  if (!c) {
    return <div className="mx-auto max-w-md py-20 text-center"><h1 className="font-display text-2xl font-bold text-ink">Campaign not found</h1><Link href="/campaigns" className="mt-5 inline-block"><Button variant="secondary">Browse campaigns</Button></Link></div>;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = !!user && c.brand_id === user.id;
  // Submitting is a creator action — hide the form from brand-only accounts.
  const { showCreatorCtas, isCreator, creatorLive } = await getViewer();
  const conceal = !!(c as { conceal_brand?: boolean }).conceal_brand;
  const companyName = (c as unknown as { brand?: { company_name: string | null } }).brand?.company_name ?? null;
  const remaining = c.pool_naira - c.spent_naira;
  const isOpen = c.funded && c.status === "open";

  const { data: subsRaw } = await supabase
    .from("campaign_submissions")
    .select("id, creator_id, url, claimed_views, approved_views, payout_naira, status, forfeit_reason, creator:creator_profiles(handle, display_name)")
    .eq("campaign_id", id)
    .order("created_at", { ascending: true });

  const taxBps = await loadTaxBps();
  const rows = subsRaw ?? [];
  const mySub = user ? rows.find((s) => s.creator_id === user.id) : undefined;
  const submissions: Submission[] = rows.map((s) => {
    const cr = (s as unknown as { creator?: { handle: string | null; display_name: string | null } }).creator;
    return {
      id: s.id,
      creatorName: cr?.display_name || (cr?.handle ? `@${cr.handle}` : "Creator"),
      creatorHandle: cr?.handle ?? null,
      url: s.url,
      claimed_views: s.claimed_views,
      approved_views: s.approved_views,
      payout_naira: s.payout_naira,
      status: s.status,
      forfeit_reason: s.forfeit_reason,
    };
  });

  return (
    <div className="grid gap-8 py-10 md:grid-cols-[1fr_340px]">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">{c.title}</h1>
        <div className="mt-1.5"><BrandByline conceal={conceal} company={companyName} /></div>
        <PillRow className="mt-4">{(c.niches ?? []).map((n: string) => <Chip key={n}>{n}</Chip>)}</PillRow>
        {c.description && <p className="mt-6 max-w-prose whitespace-pre-line leading-relaxed text-ink-2">{c.description}</p>}

        <div className="mt-10">
          <h2 className="font-display text-lg font-semibold text-ink">Submissions ({submissions.length})</h2>
          <p className="mt-0.5 text-xs text-ink-3">Claims and forfeits are public, inflated views get forfeited for everyone to see.</p>
          <div className="mt-4"><SubmissionsList submissions={submissions} isOwner={isOwner} open={isOpen} /></div>
        </div>
      </div>

      <aside>
        <Card className="md:sticky md:top-20">
          <CardBody>
            <p className="text-xs text-ink-3">Pays per 1,000 views</p>
            <p className="font-display text-3xl font-bold text-ink">{formatNaira(c.rate_per_1000_naira)}</p>
            <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-2"><Eye className="size-4" /> {formatNaira(remaining)} of {formatNaira(c.pool_naira)} pool left</p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-accent" style={{ width: `${c.pool_naira ? Math.min(100, (c.spent_naira / c.pool_naira) * 100) : 0}%` }} />
            </div>

            <div className="mt-5">
              {isOwner && !c.funded && (
                <FundPool
                  campaignId={id}
                  note={`You pay ${formatNaira(c.pool_naira + feeFor(c.pool_naira) + taxFor(c.pool_naira, taxBps))}, including the 12% fee and ${taxPercentLabel(taxBps)} tax.`}
                />
              )}
              {isOwner && c.funded && (
                <div>
                  <p className="text-sm text-ink-3">Your campaign is live. Approve submissions to pay per views.</p>
                  <div className="mt-3">
                    <BoostButton targetType="campaign" targetId={id} label="Boost this campaign" variant="secondary" size="sm" />
                  </div>
                </div>
              )}
              {!isOwner && isOpen && showCreatorCtas && isCreator && !creatorLive && (
                <Notice tone="warning" title="You're not live yet" href="/verify" action="Finish verification">
                  Submissions stay closed until verification is done. Live creators are the only ones brands can hire.
                </Notice>
              )}
              {!isOwner && isOpen && showCreatorCtas && (!isCreator || creatorLive) && (mySub ? (
                <div className="rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-ink">You submitted, status: <span className="font-medium capitalize">{mySub.status}</span>.</div>
              ) : (
                <CampaignSubmit campaignId={id} />
              ))}
              {!isOwner && isOpen && !showCreatorCtas && (
                <p className="text-sm text-ink-3">Creators submit clips to per-view campaigns. Fund your own campaign to get submissions.</p>
              )}
              {!isOwner && !isOpen && <p className="text-sm text-ink-3">This campaign isn&apos;t open for submissions.</p>}
            </div>
          </CardBody>
        </Card>
      </aside>
    </div>
  );
}

export default function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1"><Container><Suspense fallback={<div className="py-20" />}><Inner params={params} /></Suspense></Container></main>
      <SiteFooter />
    </>
  );
}
