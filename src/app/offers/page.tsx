import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { OfferList, type OfferRow } from "@/components/offers/offer-list";
import { NotificationBell } from "@/components/layout/notification-bell";
import { createClient } from "@/lib/supabase/server";
import type { BrandMetrics } from "@/components/marketplace/brand-snapshot";

export const metadata: Metadata = { title: "Offers" };

type OfferRecord = {
  id: string;
  title: string;
  brief: string | null;
  price_naira: number;
  deadline: string | null;
  status: string;
  creator_id: string;
  brand_id: string;
  creator: { handle: string; display_name: string | null } | null;
  brand: { company_name: string | null; metrics: BrandMetrics | BrandMetrics[] | null } | null;
};

async function OffersInner() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/dashboard");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("offers")
    .select(
      "id, title, brief, price_naira, deadline, status, creator_id, brand_id, creator:creator_profiles(handle,display_name), brand:brand_profiles(company_name, metrics:brand_metrics(gigs_posted,gigs_funded,gigs_completed,disputes,avg_rating,review_count))",
    )
    .or(`creator_id.eq.${user.id},brand_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const offers: OfferRow[] = ((data ?? []) as unknown as OfferRecord[]).map((o) => {
    const role: "creator" | "brand" = o.creator_id === user.id ? "creator" : "brand";
    const counterparty =
      role === "creator"
        ? o.brand?.company_name || "A brand"
        : o.creator?.display_name || (o.creator?.handle ? `@${o.creator.handle}` : "A creator");
    const bm = o.brand?.metrics;
    const brandMetrics = role === "creator" ? (Array.isArray(bm) ? bm[0] : bm) ?? undefined : undefined;
    return {
      id: o.id,
      title: o.title,
      brief: o.brief,
      price_naira: o.price_naira,
      deadline: o.deadline,
      status: o.status,
      role,
      counterparty,
      brandMetrics,
    };
  });

  return <OfferList offers={offers} />;
}

export default function OffersPage() {
  return (
    <>
      <header className="border-b border-line bg-paper/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" aria-label="UGCOrigin home"><Logo variant="combined" size={30} /></Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link href="/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>
          </div>
        </Container>
      </header>
      <Container className="py-10">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Offers</h1>
        <p className="mt-1.5 text-sm text-ink-2">Offers you&apos;ve sent and received. Accept, decline, or fund escrow to start a gig.</p>
        <div className="mt-7">
          <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-surface-2" />}>
            <OffersInner />
          </Suspense>
        </div>
      </Container>
    </>
  );
}
