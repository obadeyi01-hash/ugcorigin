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

export const metadata: Metadata = {
  title: "Find creators",
  description: "Browse verified Nigerian UGC creators by niche, budget and location.",
};

type SP = { q?: string; niche?: string; max?: string };

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
  const max = sp.max ? Number(sp.max) : undefined;

  const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  let creators: Creator[] = [];
  if (configured) {
    const supabase = await createClient();
    let query = supabase
      .from("creator_profiles")
      .select("id, handle, display_name, location, niches, starting_rate_naira, featured, verification_status")
      .eq("is_live", true)
      .order("featured", { ascending: false })
      .limit(48);

    if (niche) query = query.contains("niches", [niche]);
    if (max) query = query.lte("starting_rate_naira", max);
    if (q) query = query.or(`display_name.ilike.%${q}%,handle.ilike.%${q}%,location.ilike.%${q}%`);

    const [{ data }, { data: boostIds }] = await Promise.all([
      query,
      supabase.rpc("active_boost_target_ids", { ttype: "creator" }),
    ]);
    const boosted = new Set<string>((boostIds ?? []).map((x: unknown) => String(x)));

    creators = (data ?? [])
      .map((c) => ({
        name: c.display_name || c.handle,
        handle: c.handle,
        location: c.location ?? "Nigeria",
        niches: c.niches ?? [],
        startingRate: c.starting_rate_naira ?? 0,
        // Featured = editorially featured (admin) OR an active paid boost. This only
        // floats them into the labelled band; it never touches ranking/tier.
        featured: !!c.featured || boosted.has(c.id),
        verified: c.verification_status === "verified",
      }))
      // Featured band first (bounded + labelled on the card), organic below.
      .sort((a, b) => Number(b.featured) - Number(a.featured));
  }

  if (creators.length === 0) {
    const filtered = !!(q || niche || max);
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

  return (
    <div className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-3">
      {creators.map((c) => (
        <CreatorCard key={c.handle ?? c.name} creator={c} />
      ))}
    </div>
  );
}

export default function CreatorsPage({ searchParams }: { searchParams: Promise<SP> }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-10 sm:py-14">
          <div className="max-w-2xl">
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Find creators
            </h1>
            <p className="mt-2 text-ink-2">
              Verified Nigerian creators across beauty, food, fashion, fintech and more. Filter by niche, budget and location.
            </p>
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
