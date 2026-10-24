import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, BadgeCheck, Wallet, MessageSquare, Sparkles, Check } from "lucide-react";
import { LandingNav } from "@/components/landing/landing-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Faq } from "@/components/landing/faq";
import { JsonLd } from "@/components/seo/json-ld";
import { SAMPLE_CREATORS } from "@/lib/sample-data";

const SIGNUP = "/signup?role=brand";

export const metadata: Metadata = {
  title: "Hire verified UGC creators",
  description:
    "Get authentic, human UGC that converts, from identity-verified Nigerian creators. Escrow-protected, pay only on approval, next-day payouts. Post a brief free.",
  openGraph: {
    title: "UGCOrigin for Brands, authentic UGC from verified creators",
    description: "Hire identity-verified human creators. Escrow-protected. Pay only for work you approve.",
  },
};

const values = [
  { icon: BadgeCheck, title: "Real, verified humans", text: "Every creator passes identity verification. Original human content, never AI, never fake." },
  { icon: ShieldCheck, title: "Escrow on every deal", text: "Your money is held safely and released only when you approve the work." },
  { icon: MessageSquare, title: "One clean workspace", text: "Brief, drafts, time-stamped feedback and approval, all in one place, on the record." },
  { icon: Wallet, title: "Pay only on approval", text: "Fund up front into escrow, but release only for work you accept. Fair for everyone." },
];

const steps = [
  { n: "01", t: "Post a brief or browse", d: "Describe what you need, or find verified creators by niche, budget and location." },
  { n: "02", t: "Fund escrow", d: "Agree a deal and fund it safely. You see the exact total before you pay, nothing hidden." },
  { n: "03", t: "Review the work", d: "Get drafts in the workspace and leave time-stamped feedback or request a revision." },
  { n: "04", t: "Approve & release", d: "Happy? Approve, and the creator is paid. Not right? Dispute against the brief." },
];

const faqs = [
  { q: "What does it cost to post?", a: "Posting a brief and browsing creators is free. You only pay when you fund a deal, and the exact service fee is always shown before you pay, see our documentation for the full detail." },
  { q: "Are creators actually vetted?", a: "Yes. Every creator passes identity verification and a verified bank account before they can be hired, so you're always working with a real, accountable human." },
  { q: "What if the work isn't good?", a: "You review everything in the workspace and can request revisions. Funds stay in escrow until you approve, and if something goes wrong, you can open a dispute that's decided against your written brief." },
  { q: "How fast can I get content?", a: "You can post a brief in minutes and start receiving applications or send direct offers the same day. Turnaround is agreed with each creator." },
  { q: "Who owns the content?", a: "Usage rights are agreed as part of each deal and covered by the creator agreement. You get the content you paid for, for the usage you agreed." },
];

export default function ForBrandsPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <LandingNav ctaLabel="Post a brief" ctaHref={SIGNUP} />
      <main className="flex-1">
        {/* Hero */}
        <Container className="pt-3 sm:pt-6">
          <section className="relative -mx-4 overflow-hidden rounded-none bg-obsidian px-5 py-11 text-chalk sm:mx-0 sm:rounded-panel sm:px-10 sm:py-20">
            <div className="u-grain pointer-events-none absolute inset-0 opacity-30" />
            <div className="pointer-events-none absolute -right-24 -top-24 size-[32rem] rounded-full bg-accent/25 blur-[120px]" />
            <div className="pointer-events-none absolute -left-32 bottom-0 size-[28rem] rounded-full bg-accent-bright/10 blur-[120px]" />
            <div className="relative mx-auto max-w-3xl text-left sm:text-center">
              <Reveal>
                <h1 className="mt-4 text-balance font-display text-display font-bold text-chalk sm:mt-5">
                  Authentic UGC from <span className="text-accent-bright">real humans</span> that converts.
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="mt-4 max-w-xl text-pretty text-chalk/75 sm:mx-auto sm:mt-5 sm:text-lg">
                  Hire identity-verified Nigerian creators for content that sells. Escrow-protected, reviewed in one clean
                  workspace, and you only ever pay for work you approve.
                </p>
              </Reveal>
              <Reveal delay={180}>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link href={SIGNUP} className="w-full sm:w-auto"><Button size="lg" className="w-full sm:w-auto">Post a brief, it&apos;s free <ArrowRight className="size-4" /></Button></Link>
                  <Link href="/creators" className="w-full sm:w-auto"><Button size="lg" variant="secondary" className="w-full sm:w-auto">Browse creators</Button></Link>
                </div>
                <p className="mt-4 text-xs text-chalk/55">Free to post · Escrow-protected · Verified humans, no AI slop</p>
              </Reveal>
            </div>
          </section>
        </Container>

        {/* Proof strip, representative verified creators (real people, no fabricated metrics) */}
        <Container className="py-12">
          <p className="text-center text-sm text-ink-3">Creators ready to work across beauty, fashion, fintech, food &amp; more</p>
          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {SAMPLE_CREATORS.slice(0, 6).map((c) => (
              <div key={c.name} className="overflow-hidden rounded-2xl border border-line bg-surface">
                <div className="relative aspect-square bg-surface-2">
                  <Image src={c.image!} alt={`${c.name}, creator`} fill sizes="120px" className="object-cover" />
                </div>
                <div className="p-2 text-center">
                  <p className="truncate text-xs font-semibold text-ink">{c.name}</p>
                  <p className="truncate text-2xs text-ink-3">{c.niches[0]}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>

        {/* Values */}
        <Container className="py-6">
          <Reveal><SectionHeading align="center" eyebrow="Why UGCOrigin" title="Content you can trust, deals you can trust" subtitle="Built so brands get real, converting content from accountable people, with the money protected at every step." /></Reveal>
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
          <Reveal><SectionHeading align="center" eyebrow="How it works" title="From brief to approved in four steps" /></Reveal>
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

        {/* Anti-AI differentiator */}
        <Container className="py-6">
          <Reveal>
            <div className="rounded-3xl border border-line bg-surface p-8 sm:p-12">
              <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-tint px-3 py-1 text-xs font-semibold text-accent"><Sparkles className="size-3.5" /> The anti-AI advantage</span>
                  <h2 className="mt-4 font-display text-2xl font-semibold text-ink sm:text-3xl">AI can&apos;t build trust. Real people can.</h2>
                  <p className="mt-3 text-ink-2">Audiences scroll past synthetic content. UGCOrigin is built around proof-of-human: identity-verified creators making original content your customers actually believe, and buy from.</p>
                </div>
                <ul className="grid gap-2.5 text-sm">
                  {["Verified-human creators only", "Original content, made for your brand", "Real faces your audience relates to", "No AI avatars, no deepfakes, no fakery"].map((t) => (
                    <li key={t} className="flex items-center gap-2.5 rounded-xl border border-line bg-paper p-3 text-ink"><Check className="size-4 text-success" /> {t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </Container>

        {/* FAQ */}
        <Container className="py-12">
          <div className="mx-auto max-w-3xl">
            <Reveal><SectionHeading align="center" eyebrow="Questions" title="What brands ask us" /></Reveal>
            <div className="mt-8"><Faq items={faqs} /></div>
          </div>
        </Container>

        {/* Final CTA */}
        <Container className="pb-20">
          <section className="rounded-panel bg-obsidian px-6 py-14 text-center text-chalk sm:py-16">
            <h2 className="font-display text-3xl font-bold tracking-tight text-chalk sm:text-4xl">Get content that actually converts</h2>
            <p className="mx-auto mt-3 max-w-md text-chalk/75">Post your first brief free and meet verified creators ready to make it.</p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={SIGNUP}><Button size="lg">Post a brief <ArrowRight className="size-4" /></Button></Link>
              <Link href="/docs/for-brands"><Button size="lg" variant="ghost" className="text-chalk hover:bg-chalk/10">How it works</Button></Link>
            </div>
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
