import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Trophy, Star, CheckCircle2, TrendingUp } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { TierBadge } from "@/components/ui/tier-badge";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { createClient } from "@/lib/supabase/server";
import { tierMeta } from "@/lib/tiers";

export const metadata: Metadata = {
  title: "Weekly creator leaderboard",
  description:
    "The top-performing verified UGC creators on UGCOrigin this week, ranked by real delivered work, reputation and reviews.",
};

type Row = {
  id: string;
  handle: string | null;
  name: string;
  tier: string;
  verified: boolean;
  weeklyGigs: number;
  reputation: number;
  rating: number | null;
  reviews: number;
};

// A creator's week score: delivered work this week dominates, with reputation,
// reviews and tier as tie-breakers. Honest signals only, nothing invented.
function weekScore(r: Row): number {
  let s = r.weeklyGigs * 100;
  s += r.reputation * 0.6;
  if (r.rating && r.reviews) s += Math.min(20, r.rating * Math.log10(r.reviews + 1) * 4);
  s += tierMeta(r.tier).rank * 2;
  return s;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function Board() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return <Empty />;
  const supabase = await createClient();
  const since = new Date(Date.now() - WEEK_MS).toISOString();

  // Gigs delivered this week, grouped by creator (bounded candidate set).
  const { data: gigRows } = await supabase
    .from("gigs")
    .select("creator_id, updated_at, status")
    .in("status", ["approved", "released", "completed"])
    .gte("updated_at", since)
    .limit(2000);

  const weekly = new Map<string, number>();
  for (const g of gigRows ?? []) weekly.set(g.creator_id, (weekly.get(g.creator_id) ?? 0) + 1);

  // Fetch the live, non-shadowbanned creators who either delivered this week or
  // sit near the top by reputation (so the board is never empty in week one).
  const { data: creators } = await supabase
    .from("creator_profiles")
    .select("id, handle, display_name, tier, verification_status, earned_reputation, metrics:creator_metrics(avg_rating, review_count)")
    .eq("is_live", true)
    .eq("shadowbanned", false)
    .order("earned_reputation", { ascending: false, nullsFirst: false })
    .limit(150);

  let rows: Row[] = (creators ?? []).map((c) => {
    const m = (Array.isArray(c.metrics) ? c.metrics[0] : c.metrics) as
      | { avg_rating?: number | null; review_count?: number }
      | null;
    return {
      id: c.id,
      handle: c.handle,
      name: c.display_name || c.handle || "Creator",
      tier: c.tier ?? "origin",
      verified: c.verification_status === "verified",
      weeklyGigs: weekly.get(c.id) ?? 0,
      reputation: c.earned_reputation ?? 0,
      rating: m?.avg_rating ?? null,
      reviews: m?.review_count ?? 0,
    };
  });

  rows = rows.sort((a, b) => weekScore(b) - weekScore(a)).slice(0, 20);
  if (rows.length === 0) return <Empty />;

  const anyWeekly = rows.some((r) => r.weeklyGigs > 0);

  return (
    <ol className="mt-8 space-y-2">
      {rows.map((r, i) => {
        const rank = i + 1;
        const medal = rank === 1 ? "bg-[#d4af37]" : rank === 2 ? "bg-[#9ca3af]" : rank === 3 ? "bg-[#b06b3f]" : "bg-surface-2";
        const body = (
          <div className="u-lift flex items-center gap-4 rounded-2xl border border-line bg-surface p-4">
            <div className={`grid size-9 shrink-0 place-items-center rounded-full font-display text-sm font-bold ${rank <= 3 ? `${medal} text-obsidian` : "text-ink-3"}`}>
              {rank}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-display font-semibold text-ink">{r.name}</span>
                {r.verified && <VerifiedBadge compact />}
                <TierBadge tier={r.tier} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-3">
                {r.weeklyGigs > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="size-3.5 text-success" /> <span className="font-semibold text-ink-2">{r.weeklyGigs}</span> this week
                  </span>
                )}
                {r.rating && r.reviews > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3.5 text-accent" /> <span className="font-semibold text-ink-2">{r.rating.toFixed(1)}</span> ({r.reviews})
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <TrendingUp className="size-3.5 text-ink-3" /> {Math.round(r.reputation)} rep
                </span>
              </div>
            </div>
          </div>
        );
        return (
          <li key={r.id}>
            {r.handle ? <Link href={`/@${r.handle}`} className="block">{body}</Link> : body}
          </li>
        );
      })}
      {!anyWeekly && (
        <p className="pt-2 text-center text-xs text-ink-3">
          Quiet week so far, this board is ranked by overall reputation until the first gigs land.
        </p>
      )}
    </ol>
  );
}

function Empty() {
  return (
    <div className="mt-10 rounded-3xl border border-line bg-surface px-6 py-16 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent-tint text-accent">
        <Trophy className="size-6" />
      </div>
      <h2 className="mt-4 font-display text-xl font-semibold text-ink">The board opens with the first gigs</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">
        As verified creators deliver work, the weekly top 20 ranks them by real outcomes. Be one of the first on it.
      </p>
      <Link href="/signup?role=creator" className="mt-5 inline-block text-sm font-semibold text-accent hover:underline">
        Become a creator
      </Link>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-10 sm:py-14">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-tint px-3 py-1 text-xs font-semibold text-accent-hover">
              <Trophy className="size-3.5" /> Updated weekly
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              This week&rsquo;s top creators
            </h1>
            <p className="mt-2 text-ink-2">
              Ranked by real delivered work, reputation and verified reviews, not follower counts. Deliver great UGC, climb the board, get discovered.
            </p>
          </div>
          <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-2xl bg-surface-2" />}>
            <Board />
          </Suspense>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
