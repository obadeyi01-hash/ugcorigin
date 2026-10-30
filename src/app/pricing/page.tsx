import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, BadgeCheck, Banknote, Check, ArrowRight, Wallet, Lock } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Free to join and browse. Creators keep 100% of their rate. Payment-protected deals, pay only on approval, next-day payouts.",
};

// Honest value facts, NOT fabricated metrics. Each is a real product guarantee.
const facts = [
  { stat: "100%", label: "Creators keep their rate", sub: "No creator-side cut. What you quote is what you get." },
  { stat: "₦0", label: "To join & browse", sub: "Free profiles, free search, free messaging. Pay only for work." },
  { stat: "Next-day", label: "Creator payouts", sub: "Approved work pays out to a verified Nigerian bank account." },
];

const guarantees = [
  { icon: Lock, title: "Payment protection on every deal", text: "Funds are held safely and released only when the work is approved." },
  { icon: BadgeCheck, title: "Verified human creators", text: "Every creator passes identity verification before they can be hired." },
  { icon: Wallet, title: "Pay only on approval", text: "Brands fund up front and the payment is held safely, released only for work they accept." },
  { icon: ShieldCheck, title: "Fair dispute resolution", text: "Disputes are decided against the written brief, using the workspace record." },
];

export default function PricingPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-14 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              Pricing that works for everyone
            </h1>
            <p className="mt-4 text-lg text-ink-2">
              Free to join, free to browse, free to message. Creators keep 100% of their rate, and brands only ever pay for
              work they approve, every deal covered by payment protection.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
            {facts.map((f) => (
              <Card key={f.label} className="u-lift transition-colors hover:border-accent/30">
                <CardBody className="text-center">
                  <p className="font-display text-4xl font-bold text-accent">{f.stat}</p>
                  <p className="mt-2 font-semibold text-ink">{f.label}</p>
                  <p className="mt-1 text-sm text-ink-2">{f.sub}</p>
                </CardBody>
              </Card>
            ))}
          </div>

          <div className="mx-auto mt-14 max-w-4xl">
            <h2 className="text-center font-display text-2xl font-semibold text-ink">What every deal includes</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {guarantees.map((g) => (
                <div key={g.title} className="u-lift flex gap-3 rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-accent/30">
                  <g.icon className="size-5 shrink-0 text-accent" />
                  <div>
                    <p className="font-semibold text-ink">{g.title}</p>
                    <p className="mt-0.5 text-sm text-ink-2">{g.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* The real fee detail lives in the docs + is shown in-app before you pay. */}
          <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-line bg-surface-2 p-6 text-center">
            <p className="text-ink-2">
              Brands pay a 12% service fee on the creator&apos;s rate. A ₦20,000 video is ₦2,400 in fee, so the brand
              pays ₦22,400 plus the current tax. The creator keeps the full ₦20,000. Both numbers are shown before you fund.
            </p>
            <Link href="/docs/fees-and-payments" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
              See exactly how fees &amp; payments work <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mx-auto mt-10 max-w-4xl rounded-3xl bg-obsidian p-8 text-center text-chalk sm:p-10">
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
