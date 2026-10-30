import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LifeBuoy, ChevronDown } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TicketForm } from "@/components/support/ticket-form";
import { JsonLd } from "@/components/seo/json-ld";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Help & support",
  description: "Answers to common questions about hiring, getting paid, payment protection and trust on UGCOrigin, plus a way to reach our team.",
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "How does payment work?",
    a: "Brands fund the gig upfront through Paystack. The money is held safely and only released to the creator once the brand approves the delivered work, so both sides are protected.",
  },
  {
    q: "When do creators get paid?",
    a: "As soon as the brand approves the final content, the payout is queued to the creator's bank account. If a brand doesn't respond within the review window, approval can proceed automatically.",
  },
  {
    q: "What fees does UGCOrigin charge?",
    a: "A small service fee is added on top of the creator's rate at checkout. The creator always receives their full quoted rate.",
  },
  {
    q: "Why can't I share my phone number or email in chat yet?",
    a: "To keep everyone protected, contact details are hidden in messages until a gig is funded. Once you're booked, you'll see each other's name and number to coordinate.",
  },
  {
    q: "How do I get verified?",
    a: "Complete your profile and, when identity verification is available in your region, follow the steps in your dashboard. Verified creators rank higher and earn more trust.",
  },
  {
    q: "What is a 'Verified on UGCOrigin' clip?",
    a: "It's real work you delivered through a completed gig on the platform, which you can feature on your profile. These carry the most weight because they're backed by a real transaction.",
  },
  {
    q: "What happens if there's a dispute?",
    a: "Either side can open a dispute before a gig completes. Our Trust & Safety team reviews it against the written brief and decides how the held payment is split. Funds stay held until it's resolved.",
  },
  {
    q: "Is UGCOrigin only in Nigeria?",
    a: "We're Nigeria-first today, covering creators across all 36 states and the FCT, and building toward the rest of Africa.",
  },
];

async function MyTickets() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Card>
        <CardBody className="text-center">
          <p className="text-ink-2">Sign in to contact support and track your tickets.</p>
          <Link href="/login" className="mt-3 inline-block">
            <Button>Sign in</Button>
          </Link>
        </CardBody>
      </Card>
    );
  }

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("id, subject, status, response, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const STATUS: Record<string, string> = {
    open: "bg-warning/14 text-warning",
    in_progress: "bg-info/12 text-info",
    resolved: "bg-success/14 text-success",
    closed: "bg-surface-2 text-ink-3",
  };

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Contact support</h2>
        <p className="mt-1 text-sm text-ink-2">Can&rsquo;t find your answer above? Send us a ticket and we&rsquo;ll reply by email.</p>
        <div className="mt-4">
          <TicketForm />
        </div>
      </div>

      {tickets && tickets.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Your tickets</h2>
          <ul className="mt-3 space-y-2">
            {tickets.map((t) => (
              <li key={t.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-ink">{t.subject}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS[t.status] ?? "bg-surface-2 text-ink-3"}`}>
                    {t.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-3">{new Date(t.created_at).toLocaleDateString()}</p>
                {t.response && (
                  <div className="mt-3 rounded-xl bg-surface-2 p-3 text-sm text-ink-2">
                    <span className="font-medium text-ink">Support:</span> {t.response}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-10 sm:py-14">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-tint px-3 py-1 text-xs font-semibold text-accent-hover">
              <LifeBuoy className="size-3.5" /> Help &amp; support
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">How can we help?</h1>
            <p className="mt-2 text-ink-2">Quick answers to the most common questions, and a direct line to our team.</p>
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
            <section>
              <h2 className="font-display text-lg font-semibold text-ink">Frequently asked</h2>
              <div className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                {FAQ.map((f) => (
                  <details key={f.q} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-medium text-ink">
                      {f.q}
                      <ChevronDown className="size-4 shrink-0 text-ink-3 transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="px-4 pb-4 text-sm leading-relaxed text-ink-2">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>

            <aside>
              <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-surface-2" />}>
                <MyTickets />
              </Suspense>
            </aside>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
