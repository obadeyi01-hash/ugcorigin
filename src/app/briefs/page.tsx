import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Megaphone, Users } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { PillRow } from "@/components/ui/pill-row";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Card, CardBody } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/role";
import { formatNaira } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Open briefs",
  description: "Open paid UGC briefs from verified brands, including founding work from Dream Intrepid Ltd. Apply with a pitch and one sample.",
};

type BriefRow = {
  id: string;
  title: string;
  description: string | null;
  budget_naira: number | null;
  slots: number;
  deadline: string | null;
  niches: string[] | null;
  brand: { company_name: string | null } | null;
};

/** Brand-only "Post a brief" link; dynamic (reads the session) so it lives in Suspense. */
async function PostBriefCta() {
  const { showBrandCtas } = await getViewer();
  if (!showBrandCtas) return null;
  return <Link href="/briefs/new" className="hidden shrink-0 sm:block"><Button>Post a brief</Button></Link>;
}

async function BriefsInner() {
  const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const { showBrandCtas: showPost } = await getViewer();
  let briefs: BriefRow[] = [];
  const boosted = new Set<string>();
  if (configured) {
    const supabase = await createClient();
    const [{ data }, { data: boostIds }] = await Promise.all([
      supabase
        .from("briefs")
        .select("id, title, description, budget_naira, slots, deadline, niches, brand:brand_profiles(company_name)")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.rpc("active_boost_target_ids", { ttype: "brief" }),
    ]);
    (boostIds ?? []).forEach((x: unknown) => boosted.add(String(x)));
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

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      {briefs.map((b) => (
        <Link key={b.id} href={`/briefs/${b.id}`}>
          <Card interactive className="h-full">
            <CardBody>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display font-semibold text-ink">{b.title}</h3>
                {b.budget_naira ? <span className="shrink-0 font-display font-semibold text-ink">{formatNaira(b.budget_naira)}</span> : null}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-xs text-ink-3">{b.brand?.company_name || "A brand"}</p>
                {boosted.has(b.id) && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-2xs font-semibold text-accent-ink">Featured</span>
                )}
              </div>
              {b.description && <p className="mt-2 line-clamp-2 text-sm text-ink-2">{b.description}</p>}
              <PillRow className="mt-3">
                {(b.niches ?? []).slice(0, 3).map((n) => <Chip key={n}>{n}</Chip>)}
              </PillRow>
              <p className="mt-3 flex items-center gap-1 text-xs text-ink-3"><Users className="size-3" /> Need {b.slots}{b.deadline ? ` · due ${b.deadline}` : ""}</p>
            </CardBody>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default function BriefsPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-10 sm:py-14">
          <div className="flex items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Open briefs</h1>
              <p className="mt-2 text-ink-2">Paid work from verified brands. Dream Intrepid Ltd is hiring across beauty, fashion, food, tech and more. Apply with a pitch and one sample.</p>
            </div>
            {/* Creator-only accounts don't post briefs — the CTA resolves the session inside Suspense. */}
            <Suspense fallback={null}><PostBriefCta /></Suspense>
          </div>
          <Suspense fallback={<div className="mt-8 h-40 animate-pulse rounded-2xl bg-surface-2" />}>
            <BriefsInner />
          </Suspense>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
