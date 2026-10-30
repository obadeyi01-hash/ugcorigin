import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, BadgeCheck, Check, ArrowRight, Wallet, Layers, FileCheck, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Free to join and browse. One clear cost of doing business for brands: verified human creators, payment released only when you approve, and full usage rights. Creators keep what they earn.",
};

// What a brand actually gets for working with us: the value behind the cost.
// Honest product guarantees, not fabricated metrics or a loud fee number.
const included = [
  {
    icon: BadgeCheck,
    title: "Verified human creators",
    text: "Everyone you can hire has passed identity verification. Real people, real faces, no bots or resold accounts.",
  },
  {
    icon: Wallet,
    title: "Payment released on your approval",
    text: "You fund the work up front, but the money moves to the creator only once you accept what they deliver.",
  },
  {
    icon: Layers,
    title: "One place, brief to approved content",
    text: "Post the brief, pick creators, review drafts, and sign off, all in a single workspace, no email chaos.",
  },
  {
    icon: FileCheck,
    title: "Usage rights, sorted",
    text: "Approved content comes with the rights to use it, agreed up front and recorded on the deal.",
  },
  {
    icon: ShieldCheck,
    title: "Fair resolution if something's off",
    text: "Disputes are decided against the written brief, using the full workspace record, not a guess.",
  },
  {
    icon: Sparkles,
    title: "No agency retainer",
    text: "No monthly minimum, no lock-in. You pay for the content you commission, when you commission it.",
  },
];

export default function PricingPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-14 sm:py-20">
          {/* Hero: value-forward, no loud percentage. */}
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-sm font-semibold uppercase tracking-wide text-accent">For brands</p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              One clear cost of doing business with us
            </h1>
            <p className="mt-4 text-lg text-ink-2">
              Free to join, free to browse, free to message. When you commission content, a single service fee covers
              everything below: the verified creators, the protected payment, the workspace, and the rights. You see
              your exact total before you fund a thing.
            </p>
          </div>

          {/* The value: what the fee actually buys. */}
          <div className="mx-auto mt-14 max-w-5xl">
            <h2 className="text-center font-display text-2xl font-semibold text-ink">What your fee covers</h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-ink-2">
              Not a middleman&apos;s margin. It is the infrastructure that makes commissioning creators safe, fast, and worth it.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {included.map((item) => (
                <Card key={item.title} className="u-lift transition-colors hover:border-accent/30">
                  <CardBody>
                    <item.icon className="size-6 text-accent" />
                    <p className="mt-3 font-semibold text-ink">{item.title}</p>
                    <p className="mt-1 text-sm text-ink-2">{item.text}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>

          {/* Fee transparency: value framing, the precise number lives in-app at funding. */}
          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-line bg-surface-2 p-6 text-center sm:p-8">
            <p className="font-display text-lg font-semibold text-ink">Confident, transparent, no surprises</p>
            <p className="mt-2 text-ink-2">
              The service fee is a clear line on top of the creator&apos;s rate, shown in full, in Naira, the moment you
              fund a deal, so you always know your exact total before you commit. It is the cost of working with vetted
              creators inside a platform that protects your spend, not a number we need to shout on a page.
            </p>
            <Link
              href="/for-brands"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
            >
              See how commissioning works <ArrowRight className="size-4" />
            </Link>
          </div>

          {/* Creators: minimal, reassuring, with a subtle premium hint. */}
          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-lg font-semibold text-ink">Creating, not brand?</p>
                <p className="mt-1 text-ink-2">
                  Keep what you earn. Quote your rate, deliver the work, get paid to a verified Nigerian bank account,
                  with no creator-side cut.
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-3">
                  <Sparkles className="size-4 text-accent" /> Consistent, verified creators unlock extra perks over time.
                </p>
              </div>
              <Link href="/signup" className="shrink-0">
                <Button variant="secondary">Join as a creator</Button>
              </Link>
            </div>
          </div>

          {/* Alternative model: pay for results. */}
          <div className="mx-auto mt-10 max-w-3xl rounded-3xl bg-obsidian p-8 text-center text-chalk sm:p-10">
            <h2 className="font-display text-2xl font-semibold text-chalk">Prefer to pay for results?</h2>
            <p className="mt-2 text-chalk/75">
              Fund a per-view campaign pool and pay creators per 1,000 verified views. You set the rate; unspent pool stays
              yours; claims and forfeits are public to keep views honest.
            </p>
            <ul className="mx-auto mt-5 grid max-w-md gap-2 text-left text-sm text-chalk/85">
              <li className="flex items-center gap-2"><Check className="size-4 text-accent-bright" /> Set your own rate per 1,000 views</li>
              <li className="flex items-center gap-2"><Check className="size-4 text-accent-bright" /> Unspent pool stays yours</li>
              <li className="flex items-center gap-2"><Check className="size-4 text-accent-bright" /> Public claims &amp; forfeits keep it honest</li>
            </ul>
            <Link href="/campaigns/new" className="mt-6 inline-block">
              <Button size="lg">Start a campaign</Button>
            </Link>
          </div>

          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/briefs/new"><Button size="lg">Post a brief</Button></Link>
            <Link href="/signup"><Button size="lg" variant="secondary">Join as a creator</Button></Link>
          </div>
          <p className="mt-6 text-center text-xs text-ink-3">
            Prices in Naira. Taxes may apply where required. Full detail in our <Link href="/docs" className="underline hover:text-ink">documentation</Link>.
          </p>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
