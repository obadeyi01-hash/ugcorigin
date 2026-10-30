import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Megaphone, Users } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { BrandByline, BriefTagList } from "@/components/briefs/brief-facts";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/role";
import { formatNaira } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Open briefs",
  description: "Open paid UGC briefs from verified brands, including founding work from Dream Intrepid Ltd. Apply with a pitch and one sample.",
};

type SP = { page?: string };

const PAGE_SIZE = 12;

type BriefRow = {
  id: string;
  title: string;
  description: string | null;
  budget_naira: number | null;
  slots: number;
  deadline: string | null;
  location: string | null;
  format: string | null;
  niches: string[] | null;
  tags: string[] | null;
  conceal_brand: boolean | null;
  brand: { company_name: string | null } | null;
};

/** Brand-only "Post a brief" link; dynamic (reads the session) so it lives in Suspense. */
async function PostBriefCta() {
  const { showBrandCtas } = await getViewer();
  if (!showBrandCtas) return null;
  return <Link href="/briefs/new" className="hidden shrink-0 sm:block"><Button>Post a brief</Button></Link>;
}

async function BriefsInner({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  let page = Math.max(1, Number(sp.page) || 1);
  const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const { showBrandCtas: showPost } = await getViewer();
  let briefs: BriefRow[] = [];
  let total = 0;
  const boosted = new Set<string>();
  if (configured) {
    const supabase = await createClient();
    // A brief past its deadline is retired from the public listing even if its
    // status is still "open" (null deadline = no expiry).
    const today = new Date().toISOString().slice(0, 10);
    const notExpired = `deadline.is.null,deadline.gte.${today}`;
    const { count } = await supabase
      .from("briefs")
      .select("id", { count: "exact", head: true })
      .eq("status", "open")
      .or(notExpired);
    total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (page > totalPages) page = totalPages;
    const from = (page - 1) * PAGE_SIZE;
    const [{ data }, { data: boostIds }] = await Promise.all([
      supabase
        .from("briefs")
        .select("id, title, description, budget_naira, slots, deadline, location, format, niches, tags, conceal_brand, brand:brand_profiles(company_name)")
        .eq("status", "open")
        .or(notExpired)
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1),
      supabase.rpc("active_boost_target_ids", { ttype: "brief" }),
    ]);
    (boostIds ?? []).forEach((x: unknown) => boosted.add(String(x)));
    // Float boosted briefs to the top of the page the viewer is on.
    briefs = ((data ?? []) as unknown as BriefRow[]).sort(
      (a, b) => Number(boosted.has(b.id)) - Number(boosted.has(a.id)),
    );
  }

  if (briefs.length === 0) {
    return (
      <div className="mt-8 rounded-3xl border border-line bg-surface px-6 py-16 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent-tint text-accent"><Megaphone className="size-6" /></div>
        <h2 className="mt-4 font-display text-xl font-semibold text-ink">No open briefs yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">
          {showPost
            ? "When brands post campaigns, they'll show up here for creators to apply."
            : "Brands haven't posted any campaigns yet. Check back soon, or apply the moment one opens."}
        </p>
        {showPost && (
          <Link href="/briefs/new" className="mt-5 inline-block"><Button>Post the first brief</Button></Link>
        )}
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => (p > 1 ? `/briefs?page=${p}` : "/briefs");

  return (
    <>
      {totalPages > 1 && (
        <p className="mt-6 text-sm text-ink-3">{total} open brief{total === 1 ? "" : "s"} · page {page} of {totalPages}</p>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {briefs.map((b) => {
          const conceal = !!b.conceal_brand;
          // Keep each card to a compact mix of niches + shoot tags.
          const niches = (b.niches ?? []).slice(0, 2);
          const tags = (b.tags ?? []).slice(0, 2);
          return (
            <Link key={b.id} href={`/briefs/${b.id}`}>
              <Card interactive className="h-full">
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display font-semibold text-ink">{b.title}</h3>
                    {b.budget_naira ? <span className="shrink-0 font-display font-semibold text-ink">{formatNaira(b.budget_naira)}</span> : null}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <BrandByline conceal={conceal} company={b.brand?.company_name ?? null} />
                    {boosted.has(b.id) && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-2xs font-semibold text-accent-ink">Featured</span>
                    )}
                  </div>
                  {b.description && <p className="mt-2 line-clamp-2 text-sm text-ink-2">{b.description}</p>}
                  <div className="mt-3">
                    <BriefTagList location={b.location} format={b.format} niches={niches} tags={tags} />
                  </div>
                  <p className="mt-3 flex items-center gap-1 text-xs text-ink-3"><Users className="size-3" /> Need {b.slots}{b.deadline ? ` · due ${b.deadline}` : ""}</p>
                </CardBody>
              </Card>
            </Link>
          );
        })}
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

export default function BriefsPage({ searchParams }: { searchParams: Promise<SP> }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-10 sm:py-14">
          <div className="flex items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Open briefs</h1>
              <p className="mt-2 text-ink-2">Paid work from verified brands across beauty, fashion, food, tech and more. The company name stays private until you&apos;re hired. Apply with a pitch and one sample.</p>
            </div>
            {/* Creator-only accounts don't post briefs — the CTA resolves the session inside Suspense. */}
            <Suspense fallback={null}><PostBriefCta /></Suspense>
          </div>
          <Suspense fallback={<div className="mt-8 h-40 animate-pulse rounded-2xl bg-surface-2" />}>
            <BriefsInner searchParams={searchParams} />
          </Suspense>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
