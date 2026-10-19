import type { Metadata } from "next";
import { Suspense } from "react";
import { Sparkles, Check } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { SubscribeButton } from "@/components/pro/subscribe-button";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/utils";
import { PRO_PRICE_NAIRA } from "@/lib/pro";

export const metadata: Metadata = {
  title: "Creator Pro",
  description: "Unlock extra perks for serious UGCOrigin creators — more username changes, visibility and more.",
};

const PERKS = [
  "Change your username again (beyond the one free change)",
  "A Pro badge that signals you're serious",
  "Priority in support queues",
  "More perks rolling out for Pro members",
];

async function Inner() {
  let active = false;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gt("current_period_end", new Date().toISOString())
        .limit(1);
      active = !!data && data.length > 0;
    }
  }

  return (
    <div className="mx-auto max-w-xl py-12">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-[#a855f7] px-3 py-1 text-xs font-semibold text-white">
        <Sparkles className="size-3.5" /> Creator Pro
      </span>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Level up with Pro</h1>
      <p className="mt-2 text-ink-2">A small monthly membership for creators who want a little more from UGCOrigin.</p>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="font-display text-4xl font-bold text-ink">{formatNaira(PRO_PRICE_NAIRA)}</span>
        <span className="text-ink-3">/ month</span>
      </div>

      <ul className="mt-6 space-y-3">
        {PERKS.map((p) => (
          <li key={p} className="flex items-start gap-2 text-ink-2">
            <Check className="mt-0.5 size-4 shrink-0 text-success" /> {p}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <SubscribeButton active={active} />
      </div>
      <p className="mt-3 text-xs text-ink-3">Renews every 30 days through Paystack. Cancel anytime, your perks stay until the period ends.</p>
    </div>
  );
}

export default function ProPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container>
          <Suspense fallback={<div className="py-20" />}>
            <Inner />
          </Suspense>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
