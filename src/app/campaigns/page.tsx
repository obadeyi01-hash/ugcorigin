import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Flame, Eye } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { PillRow } from "@/components/ui/pill-row";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Card, CardBody } from "@/components/ui/card";
import { BrandByline } from "@/components/briefs/brief-facts";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/role";
import { formatNaira } from "@/lib/utils";

export const metadata: Metadata = { title: "Per-view campaigns" };

type SP = { page?: string };

const PAGE_SIZE = 12;

type Row = {
  id: string; title: string; description: string | null; niches: string[] | null;
  pool_naira: number; spent_naira: number; rate_per_1000_naira: number; status: string;
  conceal_brand: boolean | null;
  brand: { company_name: string | null } | null;
};

/** Brand-only "Create a campaign" link; dynamic (reads the session) so it lives in Suspense. */
async function CreateCampaignCta() {
  const { showBrandCtas } = await getViewer();
  if (!showBrandCtas) return null;
  return <Link href="/campaigns/new" className="hidden shrink-0 sm:block"><Button>Create a campaign</Button></Link>;
}

async function Inner({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  let page = Math.max(1, Number(sp.page) || 1);
  const { showBrandCtas: showCreate } = await getViewer();
  let rows: Row[] = [];
  let total = 0;
  const boosted = new Set<string>();
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("funded", true);
    total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (page > totalPages) page = totalPages;
    const from = (page - 1) * PAGE_SIZE;
    const [{ data }, { data: boostIds }] = await Promise.all([
      supabase
        .from("campaigns")
        .select("id, title, description, niches, pool_naira, spent_naira, rate_per_1000_naira, status, conceal_brand, brand:brand_profiles(company_name)")
        .eq("funded", true)
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1),
      supabase.rpc("active_boost_target_ids", { ttype: "campaign" }),
    ]);
    (boostIds ?? []).forEach((x: unknown) => boosted.add(String(x)));
    rows = ((data ?? []) as unknown as Row[]).sort((a, b) => Number(boosted.has(b.id)) - Number(boosted.has(a.id)));
  }

  if (rows.length === 0) {
    return (
      <div className="mt-8 rounded-3xl border border-line bg-surface px-6 py-16 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent-tint text-accent"><Flame className="size-6" /></div>
        <h2 className="mt-4 font-display text-xl font-semibold text-ink">No live campaigns yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">Per-view campaigns let brands fund a pool and pay creators for the views they drive.</p>
        {showCreate && (
          <Link href="/campaigns/new" className="mt-5 inline-block"><Button>Create a campaign</Button></Link>
        )}
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => (p > 1 ? `/campaigns?page=${p}` : "/campaigns");

  return (
    <>
      {totalPages > 1 && (
        <p className="mt-6 text-sm text-ink-3">{total} live campaign{total === 1 ? "" : "s"} · page {page} of {totalPages}</p>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {rows.map((c) => (
          <Link key={c.id} href={`/campaigns/${c.id}`}>
            <Card interactive className="h-full">
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display font-semibold text-ink">{c.title}</h3>
                  <span className="shrink-0 rounded-full bg-accent-tint px-2 py-0.5 text-xs font-semibold text-accent-hover">{formatNaira(c.rate_per_1000_naira)}/1k</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <BrandByline conceal={!!c.conceal_brand} company={c.brand?.company_name ?? null} />
                  {boosted.has(c.id) && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-2xs font-semibold text-accent-ink">Featured</span>
                  )}
                </div>
                {c.description && <p className="mt-2 line-clamp-2 text-sm text-ink-2">{c.description}</p>}
                <PillRow className="mt-3">{(c.niches ?? []).slice(0, 3).map((n) => <Chip key={n}>{n}</Chip>)}</PillRow>
                <p className="mt-3 flex items-center gap-1 text-xs text-ink-3"><Eye className="size-3" /> {formatNaira(c.pool_naira - c.spent_naira)} of {formatNaira(c.pool_naira)} pool left</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
          {page > 1 && (
            <Link href={qs(page - 1)} className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:border-accent hover:text-accent">Previous</Link>
          )}
          <span className="px-2 text-sm text-ink-3">{page} / {totalPages}</span>
          {page < totalPages && (
            <Link href={qs(page + 1)} className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:border-accent hover:text-accent">Next</Link>
          )}
        </nav>
      )}
    </>
  );
}

export default function CampaignsPage({ searchParams }: { searchParams: Promise<SP> }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-10 sm:py-14">
          <div className="flex items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Per-view campaigns</h1>
              <p className="mt-2 text-ink-2">Brands fund a pool; creators submit and get paid per 1,000 views.</p>
            </div>
            {/* Creating a campaign is a brand action — the CTA resolves the session inside Suspense. */}
            <Suspense fallback={null}><CreateCampaignCta /></Suspense>
          </div>
          <Suspense fallback={<div className="mt-8 h-40 animate-pulse rounded-2xl bg-surface-2" />}><Inner searchParams={searchParams} /></Suspense>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
