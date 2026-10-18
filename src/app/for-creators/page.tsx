import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Wallet, ShieldCheck, TrendingUp, IdCard, BadgeCheck, Check } from "lucide-react";
import { LandingNav } from "@/components/landing/landing-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Faq } from "@/components/landing/faq";
import { JsonLd } from "@/components/seo/json-ld";
import { formatNaira } from "@/lib/utils";
import { tierMeta } from "@/lib/tiers";

const SIGNUP = "/signup?role=creator";
const FLOOR = tierMeta("origin").floorNaira; // honest: the Origin-tier price floor

export const metadata: Metadata = {
  title: "Get paid for the content you make",
  description:
    "Join Nigeria's home for original, human content. Keep 100% of your rate, get next-day payouts to your bank, and build a reputation that pays. Free to join.",
  openGraph: {
    title: "UGCOrigin for Creators, keep 100%, get paid next-day",
    description: "Make content, get hired by real brands, and keep 100% of your rate. Escrow-protected, next-day payouts.",
  },
};

const values = [
  { icon: Wallet, title: "Keep 100% of your rate", text: "No creator-side cut. What you quote is exactly what lands in your bank account." },
  { icon: ShieldCheck, title: "You always get paid", text: "Brands fund escrow before you start, so the money is really there. Deliver, get approved, get paid." },
  { icon: TrendingUp, title: "Climb, earn more", text: "Price fairly with tier floors, then rise through 7 tiers as you deliver great work, unlocking higher floors and more visibility." },
  { icon: IdCard, title: "A card that sells you", text: "Your shareable profile shows your rate, packages, socials and work, send it anywhere, get booked." },
];

const steps = [
  { n: "01", t: "Create your profile", d: `Set up your handle, niches and rate, from ${formatNaira(FLOOR)} and up.` },
  { n: "02", t: "Verify & go live", d: "Confirm your identity and bank account so you can be hired and get paid." },
  { n: "03", t: "Get hired", d: "Receive direct offers, apply to open briefs, or join per-view campaigns." },
  { n: "04", t: "Deliver & get paid", d: "Work in the shared workspace, get approved, and receive a next-day payout." },
];

const faqs = [
  { q: "Does it cost anything to join?", a: "No. Creating your profile, building your card and applying to work are all free. There's no creator-side cut either, you keep 100% of your agreed rate." },
  { q: "How and when do I get paid?", a: "When a brand approves your work, your payout is queued automatically to the Nigerian bank account you verified, a next-day bank payout. The money was already held in escrow, so there's nothing to chase." },
  { q: "How much can I charge?", a: `You set your own rate. Each tier has a minimum floor (starting at ${formatNaira(FLOOR)}) so you're never pushed to underprice yourself, and as you complete gigs and earn reviews you climb tiers and unlock higher floors.` },
  { q: "How do I get discovered?", a: "You're matched to briefs and shown in the directory based on real outcomes, great work lifts you. New creators also get reserved exploration visibility so you can land your first gigs, and you can optionally boost your profile." },
  { q: "What makes UGCOrigin different?", a: "It's built for real, verified humans making original content, the opposite of AI slop. Verification, escrow and a clean workspace mean brands trust you and you always get paid." },
];

export default function ForCreatorsPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <LandingNav ctaLabel="Become a creator" ctaHref={SIGNUP} />
      <main className="flex-1">
        {/* Hero */}
        <Container className="pt-6">
          <section className="relative overflow-hidden rounded-[2rem] bg-obsidian px-5 py-14 text-chalk sm:px-10 sm:py-20">
            <div className="u-grain pointer-events-none absolute inset-0 opacity-30" />
            <div className="relative mx-auto max-w-3xl text-center">
              <Reveal>
                <span className="inline-flex items-center rounded-full border border-chalk/15 bg-chalk/[0.06] px-3.5 py-1 text-xs font-medium uppercase tracking-[0.12em] text-chalk/75">
                  For creators
                </span>
              </Reveal>
              <Reveal delay={60}>
                <h1 className="mt-5 text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-chalk sm:text-6xl">
                  Get paid well for the content you <span className="text-accent-bright">already make</span>.
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="mx-auto mt-5 max-w-xl text-pretty text-chalk/75 sm:text-lg">
                  Join Nigeria&apos;s home for original, human content. Keep 100% of your rate, get paid next-day, and build a
                  reputation that keeps the bookings coming.
                </p>
              </Reveal>
              <Reveal delay={180}>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href={SIGNUP}><Button size="lg">Create your free profile <ArrowRight className="size-4" /></Button></Link>
                  <Link href="/docs/for-creators"><Button size="lg" variant="secondary">See how it works</Button></Link>
                </div>
                <p className="mt-4 text-xs text-chalk/55">Free to join · Keep 100% · Next-day payouts</p>
              </Reveal>
            </div>
          </section>
        </Container>

        {/* Values */}
        <Container className="py-14">
          <Reveal><SectionHeading align="center" eyebrow="Why creators choose us" title="Built to pay you fairly, and on time" subtitle="Real work, real money, real protection. No cut from your rate, and no chasing invoices." /></Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 60}>
                <Card className="h-full"><CardBody>
                  <div className="grid size-10 place-items-center rounded-xl bg-accent-tint text-accent"><v.icon className="size-5" /></div>
                  <p className="mt-4 font-display font-semibold text-ink">{v.title}</p>
                  <p className="mt-1 text-sm text-ink-2">{v.text}</p>
                </CardBody></Card>
              </Reveal>
            ))}
          </div>
        </Container>

        {/* How it works */}
        <Container className="py-6">
          <Reveal><SectionHeading align="center" eyebrow="How it works" title="From profile to payout in four steps" /></Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 60}>
                <div className="h-full rounded-2xl border border-line bg-surface p-5">
                  <p className="font-display text-sm font-bold text-accent">{s.n}</p>
                  <p className="mt-2 font-semibold text-ink">{s.t}</p>
                  <p className="mt-1 text-sm text-ink-2">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>

        {/* Verified-human angle */}
        <Container className="py-12">
          <Reveal>
            <div className="rounded-3xl border border-line bg-surface p-8 sm:p-12">
              <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-tint px-3 py-1 text-xs font-semibold text-accent"><BadgeCheck className="size-3.5" /> Verified human</span>
                  <h2 className="mt-4 font-display text-2xl font-semibold text-ink sm:text-3xl">Your realness is your edge</h2>
                  <p className="mt-3 text-ink-2">In a world drowning in AI content, brands pay for genuine people. Get verified, earn the badge, and stand out as exactly what they&apos;re looking for.</p>
                </div>
                <ul className="grid gap-2.5 text-sm">
                  {["Verified-Human badge on your profile", "Keep 100% of every rate you set", "Next-day payouts to your bank", "Climb 7 tiers as your reputation grows"].map((t) => (
                    <li key={t} className="flex items-center gap-2.5 rounded-xl border border-line bg-paper p-3 text-ink"><Check className="size-4 text-success" /> {t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </Container>

        {/* FAQ */}
        <Container className="py-6">
          <div className="mx-auto max-w-3xl">
            <Reveal><SectionHeading align="center" eyebrow="Questions" title="What creators ask us" /></Reveal>
            <div className="mt-8"><Faq items={faqs} /></div>
          </div>
        </Container>

        {/* Final CTA */}
        <Container className="py-16">
          <section className="rounded-[2rem] bg-obsidian px-6 py-14 text-center text-chalk sm:py-16">
            <h2 className="font-display text-3xl font-bold tracking-tight text-chalk sm:text-4xl">Start earning from your content</h2>
            <p className="mx-auto mt-3 max-w-md text-chalk/75">Create your free profile today and get in front of brands looking for exactly you.</p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={SIGNUP}><Button size="lg">Become a creator <ArrowRight className="size-4" /></Button></Link>
              <Link href="/for-brands"><Button size="lg" variant="ghost" className="text-chalk hover:bg-chalk/10">I&apos;m a brand</Button></Link>
            </div>
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
