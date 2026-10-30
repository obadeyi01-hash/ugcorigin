import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Wallet, ShieldCheck, TrendingUp, BadgeCheck, Users, Megaphone } from "lucide-react";
import { LandingNav } from "@/components/landing/landing-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { BrandByline, BriefTagList } from "@/components/briefs/brief-facts";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/utils";
import { tierMeta } from "@/lib/tiers";

const SIGNUP = "/signup?role=creator";
const FLOOR = tierMeta("origin").floorNaira;

export const metadata: Metadata = {
  title: "You're invited to get paid for your content",
  description:
    "An invite to join Nigeria's home for original, human content. Keep 100% of your rate, get next-day payouts to your bank, and apply to paid briefs that are open right now. Free to join.",
  openGraph: {
    title: "Get paid for the content you already make",
    description: "Join as a creator, keep 100% of your rate, and apply to paid briefs open right now. Next-day payouts, payment-protected.",
  },
};

type BriefRow = {
  id: string;
  title: string;
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

/**
 * Pulls a few live, masked briefs so a potential creator sees real paid work
 * is open right now, not a promise. The hiring company stays private (same
 * masking as the public briefs board). A DB hiccup must never break the page.
 */
async function openBriefs(): Promise<{ total: number; sample: BriefRow[] }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { total: 0, sample: [] };
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().slice(0, 10);
    const notExpired = `deadline.is.null,deadline.gte.${today}`;
    const [{ count }, { data }] = await Promise.all([
      supabase.from("briefs").select("id", { count: "exact", head: true }).eq("status", "open").or(notExpired),
      supabase
        .from("briefs")
        .select("id, title, budget_naira, slots, deadline, location, format, niches, tags, conceal_brand, brand:brand_profiles(company_name)")
        .eq("status", "open")
        .or(notExpired)
        .order("created_at", { ascending: false })
        .limit(4),
    ]);
    return { total: count ?? 0, sample: ((data ?? []) as unknown as BriefRow[]) };
  } catch {
    return { total: 0, sample: [] };
  }
}

const values = [
  { icon: Wallet, title: "Keep 100% of your rate", text: "No creator-side cut. What you quote is exactly what lands in your bank account." },
  { icon: ShieldCheck, title: "You always get paid", text: "Brands fund the gig before you start, so the money is really there and held safely until you deliver." },
  { icon: TrendingUp, title: "Climb, earn more", text: "Start with a fair floor, then rise through tiers as you deliver great work and unlock higher rates." },
  { icon: BadgeCheck, title: "Your realness is the edge", text: "Get verified as a real human. In a world full of AI content, that is exactly what brands pay for." },
];

const steps = [
  { n: "01", t: "Create your free profile", d: `Pick a handle and niches, and set your rate from ${formatNaira(FLOOR)} up.` },
  { n: "02", t: "Verify and go live", d: "Confirm your identity and bank so you can be hired and paid." },
  { n: "03", t: "Apply and get hired", d: "Apply to open briefs, join per-view campaigns, or take direct offers." },
  { n: "04", t: "Deliver and get paid", d: "Work in the shared space, get approved, and receive a next-day payout." },
];

/** The live-work section. Async + Suspense-wrapped so the static shell can
 * still prerender while the DB read streams in. */
async function OpenBriefs() {
  const { total, sample } = await openBriefs();
  return (
    <Container className="py-14">
      <Reveal>
        <SectionHeading
          align="center"
          eyebrow="Open right now"
          title={total > 0 ? `${total} paid brief${total === 1 ? "" : "s"} waiting for a creator` : "Paid briefs open regularly"}
          subtitle="Real work from verified brands. The company name stays private until you are hired, so here is the work, the pay and the location."
        />
      </Reveal>

      {sample.length > 0 ? (
        <>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {sample.map((b, i) => (
              <Reveal key={b.id} delay={i * 60}>
                <Link href={`/briefs/${b.id}`}>
                  <Card interactive className="h-full">
                    <CardBody>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-display font-semibold text-ink">{b.title}</h3>
                        {b.budget_naira ? <span className="shrink-0 font-display font-semibold text-ink">{formatNaira(b.budget_naira)}</span> : null}
                      </div>
                      <div className="mt-1">
                        <BrandByline conceal={!!b.conceal_brand} company={b.brand?.company_name ?? null} />
                      </div>
                      <div className="mt-3">
                        <BriefTagList location={b.location} format={b.format} niches={(b.niches ?? []).slice(0, 2)} tags={(b.tags ?? []).slice(0, 2)} />
                      </div>
                      <p className="mt-3 flex items-center gap-1 text-xs text-ink-3">
                        <Users className="size-3" /> Need {b.slots}{b.deadline ? ` · due ${b.deadline}` : ""}
                      </p>
                    </CardBody>
                  </Card>
                </Link>
              </Reveal>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href={SIGNUP}><Button size="lg">Create a profile to apply <ArrowRight className="size-4" /></Button></Link>
            <p className="mt-3 text-sm text-ink-3">Applying takes a short pitch and one sample. <Link href="/briefs" className="font-medium text-accent hover:text-accent-hover">Browse all open briefs</Link>.</p>
          </div>
        </>
      ) : (
        <div className="mx-auto mt-10 max-w-md rounded-3xl border border-line bg-surface px-6 py-12 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent-tint text-accent"><Megaphone className="size-6" /></div>
          <p className="mt-4 text-sm text-ink-2">New paid briefs open regularly. Create your profile now so you are ready to apply the moment one lands.</p>
          <Link href={SIGNUP} className="mt-5 inline-block"><Button>Become a creator <ArrowRight className="size-4" /></Button></Link>
        </div>
      )}
    </Container>
  );
}

export default function JoinPage() {
  return (
    <>
      <LandingNav ctaLabel="Become a creator" ctaHref={SIGNUP} />
      <main className="flex-1">
        {/* Hero, framed as a personal invite */}
        <Container className="pt-3 sm:pt-6">
          <section className="relative -mx-4 overflow-hidden rounded-none bg-obsidian px-5 py-11 text-chalk sm:mx-0 sm:rounded-panel sm:px-10 sm:py-20">
            <div className="u-grain pointer-events-none absolute inset-0 opacity-30" />
            <div className="pointer-events-none absolute -right-24 -top-24 size-[32rem] rounded-full bg-accent/25 blur-[120px]" />
            <div className="pointer-events-none absolute -left-32 bottom-0 size-[28rem] rounded-full bg-accent-bright/10 blur-[120px]" />
            <div className="relative mx-auto max-w-3xl text-left sm:text-center">
              <Reveal>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-chalk/10 px-3 py-1 text-xs font-semibold text-chalk/80 ring-1 ring-chalk/15">
                  <Megaphone className="size-3.5" /> You are invited
                </span>
              </Reveal>
              <Reveal delay={90}>
                <h1 className="mt-4 text-balance font-display text-display font-bold text-chalk sm:mt-5">
                  Get paid for the content you <span className="text-accent-bright">already make</span>.
                </h1>
              </Reveal>
              <Reveal delay={150}>
                <p className="mt-4 max-w-xl text-pretty text-chalk/75 sm:mx-auto sm:mt-5 sm:text-lg">
                  Join Nigeria&apos;s home for original, human content. Keep 100% of your rate, get paid next-day to your
                  bank, and start applying to real paid briefs today.
                </p>
              </Reveal>
              <Reveal delay={210}>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link href={SIGNUP} className="w-full sm:w-auto"><Button size="lg" className="w-full sm:w-auto">Become a creator, it is free <ArrowRight className="size-4" /></Button></Link>
                  <Link href="/briefs" className="w-full sm:w-auto"><Button size="lg" variant="secondary" className="w-full sm:w-auto">See the open briefs</Button></Link>
                </div>
                <p className="mt-4 text-xs text-chalk/55">Free to join · Keep 100% · Next-day payouts</p>
              </Reveal>
            </div>
          </section>
        </Container>

        {/* Real paid work, open right now, the reason to sign up today */}
        <Suspense fallback={<Container className="py-14"><div className="h-64 animate-pulse rounded-2xl bg-surface-2" /></Container>}>
          <OpenBriefs />
        </Suspense>

        {/* Why join */}
        <Container className="py-6">
          <Reveal><SectionHeading align="center" eyebrow="Why creators join" title="Real money, real protection, no cut" /></Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 60}>
                <Card className="group h-full u-lift transition-colors hover:border-accent/30"><CardBody>
                  <div className="grid size-10 place-items-center rounded-xl bg-accent-tint text-accent transition-transform duration-300 group-hover:scale-110"><v.icon className="size-5" /></div>
                  <p className="mt-4 font-display font-semibold text-ink">{v.title}</p>
                  <p className="mt-1 text-sm text-ink-2">{v.text}</p>
                </CardBody></Card>
              </Reveal>
            ))}
          </div>
        </Container>

        {/* How it works */}
        <Container className="py-12">
          <Reveal><SectionHeading align="center" eyebrow="How it works" title="From invite to first payout in four steps" /></Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 60}>
                <div className="u-lift h-full rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-accent/30">
                  <p className="font-display text-sm font-bold text-accent">{s.n}</p>
                  <p className="mt-2 font-semibold text-ink">{s.t}</p>
                  <p className="mt-1 text-sm text-ink-2">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>

        {/* Final CTA */}
        <Container className="py-16">
          <section className="rounded-panel bg-obsidian px-6 py-14 text-center text-chalk sm:py-16">
            <h2 className="font-display text-3xl font-bold tracking-tight text-chalk sm:text-4xl">Your invite is open</h2>
            <p className="mx-auto mt-3 max-w-md text-chalk/75">Create your free profile and get in front of brands looking for exactly you.</p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={SIGNUP}><Button size="lg">Become a creator <ArrowRight className="size-4" /></Button></Link>
              <Link href="/for-creators"><Button size="lg" variant="ghost" className="text-chalk hover:bg-chalk/10">How it all works</Button></Link>
            </div>
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
