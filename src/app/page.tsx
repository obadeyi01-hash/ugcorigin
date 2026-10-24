import Link from "next/link";
import { Suspense, cache } from "react";
import {
  ShieldCheck,
  BadgeCheck,
  Banknote,
  ArrowRight,
  Lock,
  PencilLine,
  CircleCheckBig,
  FileDown,
  Store,
  Building2,
  Rocket,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { PillRow } from "@/components/ui/pill-row";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { CreatorCard } from "@/components/marketplace/creator-card";
import { CardScroller } from "@/components/marketplace/card-scroller";
import { HeroSearch } from "@/components/marketplace/hero-search";
import { StatsBand } from "@/components/marketplace/stats-band";
import { SAMPLE_CREATORS, NICHES } from "@/lib/sample-data";
import { topRankedCreators } from "@/lib/creators/top";
import { ProductMomentCard, HowItWorks } from "@/components/marketplace/product-moments";

const steps = [
  {
    icon: PencilLine,
    title: "Write a brief in minutes",
    body: "Our 3-step wizard turns what you sell into a clear brief, format, hook angles, do's and don'ts, usage rights. Or start from a template.",
  },
  {
    icon: ShieldCheck,
    title: "Fund it, safely",
    body: "Your payment is held in escrow the moment you hire. Creators know they'll be paid; you know the work will be delivered. Nobody gets ghosted.",
  },
  {
    icon: CircleCheckBig,
    title: "Review, approve, release",
    body: "Leave time-stamped notes right on the video. Approve to unlock the final files and release payment, settled to the creator's bank the next day.",
  },
];

const values = [
  {
    icon: ShieldCheck,
    title: "Escrow by default",
    body: "Money is locked until you approve the work. Every deal is protected, and disputes are judged against the written brief, not who shouts loudest.",
  },
  {
    icon: BadgeCheck,
    title: "Verified humans only",
    body: "Every creator passes identity verification before they can be hired. Real people, real content, with proof of origin in a world full of AI.",
  },
  {
    icon: FileDown,
    title: "You own what you buy",
    body: "Approved content unlocks in high resolution with the usage rights set in the brief. Run it as ads, on your site, anywhere you need it.",
  },
];

const audiences = [
  { icon: Store, title: "Small brands", body: "Launch budget-friendly campaigns with vetted creators, no agency, no retainer.", tint: "bg-accent-tint" },
  { icon: ShoppingBag, title: "E-commerce", body: "Stock your product pages and ads with content that actually sells.", tint: "bg-peach" },
  { icon: Rocket, title: "Founders", body: "Get your first testimonials and demos without hiring in-house.", tint: "bg-lavender" },
  { icon: Building2, title: "Agencies", body: "Run every client's creator program from one clean dashboard.", tint: "bg-mint" },
];

// Engine-ranked live creators for the homepage strips, deduped across the two
// strip instances. Falls back to the pre-launch sample set until real creators
// exist. Fetched inside Suspense so the static landing shell isn't blocked.
const getStrip = cache(async () => {
  const live = await topRankedCreators(8);
  return live.length >= 4 ? live : SAMPLE_CREATORS;
});

async function HeroStrip() {
  const strip = await getStrip();
  return (
    <>
      {strip.slice(0, 3).map((c, i) => (
        <Reveal key={c.handle ?? c.name} delay={i * 60}>
          <CreatorCard creator={{ ...c, priority: i < 2 }} />
        </Reveal>
      ))}
    </>
  );
}

async function MidStrip() {
  const strip = await getStrip();
  return (
    <>
      {strip.slice(2, 8).map((c, i) => (
        <Reveal key={c.handle ?? c.name} delay={i * 50}>
          <CreatorCard creator={c} />
        </Reveal>
      ))}
    </>
  );
}

function SampleStrip({ from, to, priorityCount = 0 }: { from: number; to: number; priorityCount?: number }) {
  return (
    <>
      {SAMPLE_CREATORS.slice(from, to).map((c, i) => (
        <Reveal key={c.name} delay={i * 60}>
          <CreatorCard creator={{ ...c, priority: i < priorityCount }} />
        </Reveal>
      ))}
    </>
  );
}

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* Hero — full-bleed on mobile (edge to edge), a contained card on desktop */}
        <Container className="pt-3 sm:pt-8">
          <section className="relative -mx-4 overflow-hidden rounded-none bg-obsidian px-5 py-8 text-chalk sm:mx-0 sm:rounded-panel sm:px-10 sm:py-14">
            <div className="u-grain pointer-events-none absolute inset-0 opacity-30" />
            {/* Soft brand glows for depth */}
            <div className="pointer-events-none absolute -right-24 -top-24 size-[32rem] rounded-full bg-accent/25 blur-[120px]" />
            <div className="pointer-events-none absolute -left-32 bottom-0 size-[28rem] rounded-full bg-accent-bright/10 blur-[120px]" />
            <div className="relative mx-auto max-w-3xl text-left sm:text-center">
              <Reveal>
                <h1 className="mt-4 text-balance font-display text-display font-bold text-chalk">
                  Original content from{" "}
                  <span className="text-accent-bright">real humans</span>.
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="mt-3 max-w-xl text-balance text-base text-chalk/70 sm:mx-auto sm:mt-4 sm:text-lg">
                  Hire verified creators and pay only when the work&apos;s approved.
                </p>
              </Reveal>
              <Reveal delay={180} className="relative z-30 mt-6 sm:mt-8">
                <HeroSearch />
              </Reveal>
              <Reveal delay={240}>
                <div className="mt-6 flex flex-wrap items-center justify-start gap-x-5 gap-y-2 text-sm text-chalk/65 sm:justify-center">
                  <span className="inline-flex items-center gap-1.5">
                    <Lock className="size-4 text-accent-bright" /> Escrow-protected
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <BadgeCheck className="size-4 text-accent-bright" /> Verified creators
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Banknote className="size-4 text-accent-bright" /> Paystack payouts
                  </span>
                </div>
              </Reveal>
            </div>

            {/* Creator strip — brings real faces into the first view */}
            <CardScroller gridClass="mt-7 grid-cols-2 lg:grid-cols-4" className="relative">
              <ProductMomentCard />
              <Suspense fallback={<SampleStrip from={0} to={3} priorityCount={1} />}>
                <HeroStrip />
              </Suspense>
            </CardScroller>
          </section>
        </Container>

        {/* Stats / product facts */}
        <Container className="py-12">
          <StatsBand />
        </Container>

        {/* How it works — full-bleed band for a distinct "area" */}
        <section className="bg-gradient-to-b from-surface to-paper py-16 sm:py-24">
          <Container>
            <SectionHeading
              align="center"
              eyebrow="How it works"
              title="One place, from brief to approved content"
              subtitle="No scattered DMs, no deals lost in WhatsApp. Every step happens on UGCOrigin, so nothing slips and nobody gets burned."
            />
            <HowItWorks steps={steps} />
          </Container>
        </section>

        {/* Value props — bento: one wide feature tile + two supporting */}
        <section className="pb-16 sm:pb-24">
          <Container>
            <div className="grid gap-4 sm:grid-cols-2">
              {values.map((v, i) => {
                const feature = i === 0;
                return (
                  <Reveal key={v.title} delay={i * 80} className={feature ? "sm:col-span-2" : undefined}>
                    <div
                      className={cn(
                        "u-lift h-full rounded-3xl border p-7 transition-colors sm:p-8",
                        feature
                          ? "border-accent/15 bg-accent-tint/50"
                          : "border-line bg-surface",
                      )}
                    >
                      <div className="grid size-12 place-items-center rounded-2xl bg-white/70 text-accent shadow-sm">
                        <v.icon className="size-6" />
                      </div>
                      <h3 className={cn("mt-5 font-display font-semibold text-ink", feature ? "text-2xl" : "text-xl")}>
                        {v.title}
                      </h3>
                      <p className={cn("mt-2 leading-relaxed text-ink-2", feature ? "max-w-xl text-base" : "text-sm")}>
                        {v.body}
                      </p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </Container>
        </section>

        {/* Creators across Nigeria (representative, no fabricated metrics) */}
        <section className="relative overflow-hidden bg-gradient-to-b from-paper via-accent-tint/25 to-paper py-16 sm:py-24">
          <div className="pointer-events-none absolute left-1/2 top-0 size-[40rem] -translate-x-1/2 rounded-full bg-accent/5 blur-[140px]" />
          <Container className="relative">
            <div className="flex items-end justify-between gap-4">
              <SectionHeading
                eyebrow="Creators"
                title="Talent across Nigeria"
                subtitle="Real people in beauty, food, fashion, fintech and more. Browse the directory to see live rates and work."
              />
              <Link href="/creators" className="hidden shrink-0 sm:block">
                <Button variant="ghost" size="sm">
                  Browse all <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
            <CardScroller gridClass="mt-10 grid-cols-2 lg:grid-cols-3">
              <Suspense fallback={<SampleStrip from={2} to={8} />}>
                <MidStrip />
              </Suspense>
            </CardScroller>
            <div className="mt-8 text-center sm:hidden">
              <Link href="/creators">
                <Button variant="secondary">Browse all creators</Button>
              </Link>
            </div>
          </Container>
        </section>

        {/* Built for every team */}
        <section className="pb-16 sm:pb-24">
          <Container>
            <SectionHeading align="center" eyebrow="For every team" title="However you grow, UGCOrigin fits" />
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {audiences.map((a, i) => (
                <Reveal key={a.title} delay={i * 70}>
                  <div className={`group u-lift h-full rounded-2xl border border-line/60 p-7 ${a.tint}`}>
                    <div className="grid size-11 place-items-center rounded-xl bg-surface text-ink shadow-xs transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                      <a.icon className="size-5" />
                    </div>
                    <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                      {a.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-2">{a.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>

        {/* Niches */}
        <section className="pb-16 sm:pb-24">
          <Container>
            <div className="rounded-3xl border border-line bg-surface p-8 sm:p-12">
              <SectionHeading
                eyebrow="Every niche"
                title="Find the right creator for your product"
                subtitle="From skincare unboxings to fintech demos, filter by niche, format, budget and location."
              />
              <PillRow className="mt-7 gap-2.5">
                {NICHES.map((n) => (
                  <Link
                    key={n}
                    href={`/creators?niche=${encodeURIComponent(n)}`}
                    className="u-press rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:border-accent hover:text-accent"
                  >
                    {n}
                  </Link>
                ))}
              </PillRow>
            </div>
          </Container>
        </section>

        {/* Final CTA */}
        <section className="pb-20">
          <Container>
            <div className="relative overflow-hidden rounded-panel bg-obsidian px-8 py-16 text-center text-chalk sm:px-12">
              <div className="u-grain pointer-events-none absolute inset-0 opacity-30" />
              <div className="relative">
                <h2 className="mx-auto max-w-2xl text-balance font-display text-3xl font-bold tracking-tight text-chalk sm:text-4xl">
                  In a world flooded with AI, originality wins.
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-balance text-chalk/70">
                  Every creator here is a verified human. Start your first campaign
                  today, or set up your creator profile and get hired.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href="/briefs/new">
                    <Button size="lg">
                      Hire a creator <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="lg" variant="outline" className="border-chalk/25 text-chalk hover:bg-chalk/10">
                      Join as a creator
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
