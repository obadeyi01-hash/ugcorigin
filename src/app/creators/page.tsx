import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { CreatorCard, type Creator } from "@/components/marketplace/creator-card";
import { DirectoryFilters } from "@/components/marketplace/directory-filters";
import { createClient } from "@/lib/supabase/server";
import { rankCreators, type RankCreator } from "@/lib/ranking";
import { publicName } from "@/lib/names";

// Per-filter SEO: a niche/region query reads like a landing page so it ranks
// for "hire <niche> UGC creators in <region>".
export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const niche = (sp.niche ?? "").trim();
  const region = (sp.region ?? "").trim();
  const where = region && region !== "Remote" ? ` in ${region}` : "";

  if (niche) {
    const u = new URLSearchParams({ niche });
    if (region) u.set("region", region);
    return {
      title: `Hire ${niche} UGC creators${where || " in Nigeria"}`,
      description: `Browse verified ${niche} creators${where} on UGCOrigin. Real, human, identity-verified. Escrow-protected payments, Nigeria-first.`,
      alternates: { canonical: `/creators?${u.toString()}` },
    };
  }
  return {
    title: "Find creators",
    description: "Browse verified Nigerian UGC creators by category, region, budget and platform. Escrow-protected, identity-verified.",
    alternates: { canonical: "/creators" },
  };
}

type SP = { q?: string; niche?: string; region?: string; max?: string; platform?: string; sort?: string; page?: string };

const PAGE_SIZE = 24;

function GridSkeleton() {
  return (
    <div className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="aspect-[4/5] animate-pulse bg-surface-2" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-surface-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function CreatorResults({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").replace(/[,()%*]/g, "").trim();
  const niche = sp.niche ?? "";
  const region = sp.region ?? "";
  const platform = sp.platform ?? "";
  const sort = sp.sort ?? "";
  const max = sp.max ? Number(sp.max) : undefined;
  let page = Math.max(1, Number(sp.page) || 1);
  let total = 0;

  const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  let creators: Creator[] = [];
  let noPlatformMatch = false;
  if (configured) {
    const supabase = await createClient();

    // Is the viewer a brand? If so, they can save creators; fetch their saves.
    const {
      data: { user: viewer },
    } = await supabase.auth.getUser();
    let canSave = false;
    const savedSet = new Set<string>();
    if (viewer) {
      const [{ data: brand }, { data: saves }] = await Promise.all([
        supabase.from("brand_profiles").select("id").eq("id", viewer.id).maybeSingle(),
        supabase.from("saved_creators").select("creator_id").eq("brand_id", viewer.id),
      ]);
      canSave = !!brand;
      (saves ?? []).forEach((s) => savedSet.add(s.creator_id));
    }

    // Platform filter: pre-resolve the creator ids that have that platform
    // linked (indexed), then constrain the main query.
    let platformIds: string[] | null = null;
    if (platform) {
      const { data: pa } = await supabase.from("social_accounts").select("creator_id").eq("platform", platform).limit(3000);
      platformIds = [...new Set((pa ?? []).map((x) => x.creator_id))];
      if (platformIds.length === 0) noPlatformMatch = true;
    }

    if (!noPlatformMatch) {
      let query = supabase
        .from("creator_profiles")
        .select(
          "id, handle, display_name, first_name, last_name, location, niches, starting_rate_naira, featured, verification_status, tier, earned_reputation, updated_at, avatar_url, strikes, benched, metrics:creator_metrics(avg_rating, review_count, gigs_completed)",
        )
        .eq("is_live", true)
        .eq("shadowbanned", false)
        .limit(120);

      if (niche) query = query.contains("niches", [niche]);
      if (max) query = query.lte("starting_rate_naira", max);
      if (region && region !== "Remote") query = query.ilike("location", `%${region}%`);
      if (q) query = query.or(`display_name.ilike.%${q}%,handle.ilike.%${q}%,location.ilike.%${q}%`);
      if (platformIds) query = query.in("id", platformIds);

      const [{ data }, { data: boostIds }] = await Promise.all([
        query,
        supabase.rpc("active_boost_target_ids", { ttype: "creator" }),
      ]);
      const boosted = new Set<string>((boostIds ?? []).map((x: unknown) => String(x)));

      // Flatten + attach boost flag + review metrics.
      let rows: RankCreator[] = (data ?? []).map((c) => {
        const m = (Array.isArray(c.metrics) ? c.metrics[0] : c.metrics) as { avg_rating?: number | null; review_count?: number; gigs_completed?: number } | null;
        return {
          id: c.id,
          handle: c.handle,
          display_name: c.display_name,
          location: c.location,
          niches: c.niches ?? [],
          starting_rate_naira: c.starting_rate_naira,
          featured: !!c.featured,
          verification_status: c.verification_status,
          tier: c.tier ?? "origin",
          earned_reputation: c.earned_reputation,
          updated_at: c.updated_at,
          avg_rating: m?.avg_rating ?? null,
          review_count: m?.review_count ?? 0,
          boosted: boosted.has(c.id),
          avatar_url: c.avatar_url as string | null,
          gigs_completed: m?.gigs_completed ?? 0,
          first_name: c.first_name as string | null,
          last_name: c.last_name as string | null,
          strikes: (c.strikes as number | null) ?? 0,
          benched: !!c.benched,
        } as RankCreator & { avatar_url: string | null; gigs_completed: number; first_name: string | null; last_name: string | null };
      });

      // Sort: Recommended (default) uses the ranking engine; the rest are explicit.
      if (sort === "price_asc") rows.sort((a, b) => (a.starting_rate_naira ?? 1e12) - (b.starting_rate_naira ?? 1e12));
      else if (sort === "price_desc") rows.sort((a, b) => (b.starting_rate_naira ?? 0) - (a.starting_rate_naira ?? 0));
      else if (sort === "recent") rows.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      else if (sort === "rating") rows.sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
      else rows = rankCreators(rows, { niche, q });

      // Paginate the ranked set (bounded candidate window ranked in memory).
      total = rows.length;
      const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      if (page > totalPages) page = totalPages;
      rows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

      creators = rows.map((c) => ({
        name: publicName({
          first: (c as RankCreator & { first_name?: string | null }).first_name,
          last: (c as RankCreator & { last_name?: string | null }).last_name,
          display: c.display_name,
          handle: c.handle,
        }),
        handle: c.handle ?? undefined,
        image: (c as RankCreator & { avatar_url?: string | null }).avatar_url || undefined,
        location: c.location ?? "Nigeria",
        niches: c.niches ?? [],
        startingRate: c.starting_rate_naira ?? 0,
        featured: c.featured || !!c.boosted,
        verified: c.verification_status === "verified",
        id: c.id,
        canSave,
        saved: savedSet.has(c.id),
        ...(c.review_count && c.avg_rating ? { rating: c.avg_rating, reviews: c.review_count } : {}),
        ...((c as RankCreator & { gigs_completed?: number }).gigs_completed ? { gigsCompleted: (c as RankCreator & { gigs_completed?: number }).gigs_completed } : {}),
      }));
    }
  }

  if (creators.length === 0) {
    const filtered = !!(q || niche || region || max || platform);
    return (
      <div className="mt-10 rounded-3xl border border-line bg-surface px-6 py-16 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent-tint text-accent">
          <Users className="size-6" />
        </div>
        <h2 className="mt-4 font-display text-xl font-semibold text-ink">
          {filtered ? "No creators match these filters yet" : "The directory is just opening"}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">
          {filtered
            ? "Try clearing a filter or widening your budget."
            : "We're onboarding our first verified creators. Be one of the first, set up your profile and get hired."}
        </p>
        {!filtered && (
          <Link href="/signup" className="mt-5 inline-block">
            <Button>Become a creator</Button>
          </Link>
        )}
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (niche) u.set("niche", niche);
    if (region) u.set("region", region);
    if (max) u.set("max", String(max));
    if (platform) u.set("platform", platform);
    if (sort) u.set("sort", sort);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return s ? `/creators?${s}` : "/creators";
  };

  return (
    <div className="mt-6">
      <p className="text-sm text-ink-3">
        {total} creator{total === 1 ? "" : "s"}
        {niche ? ` in ${niche}` : ""}
        {sort === "" ? " · recommended for you" : ""}
        {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-5 lg:grid-cols-3">
        {creators.map((c) => (
          <CreatorCard key={c.handle ?? c.name} creator={c} />
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
          {page > 1 && (
            <Link href={qs(page - 1)} className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:border-accent hover:text-accent">
              Previous
            </Link>
          )}
          <span className="px-2 text-sm text-ink-3">{page} / {totalPages}</span>
          {page < totalPages && (
            <Link href={qs(page + 1)} className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:border-accent hover:text-accent">
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

export default function CreatorsPage({ searchParams }: { searchParams: Promise<SP> }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-10 sm:py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Find creators
              </h1>
              <p className="mt-2 text-ink-2">
                Verified Nigerian creators across beauty, food, fashion, fintech and more. Filter by service, region, budget and platform, sorted by what fits best.
              </p>
            </div>
            <Link
              href="/briefs/new"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:border-accent hover:text-accent"
            >
              <Users className="size-4" /> Hiring at scale? Post a brief for up to 100 creators
            </Link>
          </div>

          <div className="mt-8">
            <Suspense fallback={<div className="h-11 animate-pulse rounded-full bg-surface-2" />}>
              <DirectoryFilters />
            </Suspense>
          </div>

          <Suspense fallback={<GridSkeleton />}>
            <CreatorResults searchParams={searchParams} />
          </Suspense>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
