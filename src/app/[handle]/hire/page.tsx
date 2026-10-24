import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { OfferForm } from "@/components/offers/offer-form";
import { AccessNotice } from "@/components/layout/access-notice";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/role";

export const metadata: Metadata = { title: "Make an offer" };

async function HireInner({ params, searchParams }: { params: Promise<{ handle: string }>; searchParams: Promise<{ title?: string; price?: string }> }) {
  const { handle: raw } = await params;
  const { title: spTitle, price: spPrice } = await searchParams;
  const handle = decodeURIComponent(raw).replace(/^@/, "").toLowerCase();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/dashboard");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { isBrand } = await getViewer();
  if (!isBrand) {
    return (
      <AccessNotice
        title="Only brands can make offers"
        message="Hiring a creator is a brand action. You're signed in as a creator — add a brand account to send offers."
        cta={{ label: "Add a brand account", href: "/onboarding?role=brand" }}
      />
    );
  }

  const { data: creator } = await supabase
    .from("creator_profiles")
    .select("handle, display_name, starting_rate_naira")
    .eq("handle", handle)
    .maybeSingle();

  if (!creator) {
    return (
      <div className="py-20 text-center">
        <p className="text-ink-2">That creator could not be found.</p>
        <Link href="/creators" className="mt-4 inline-block"><Button variant="secondary">Browse creators</Button></Link>
      </div>
    );
  }

  const name = creator.display_name || `@${creator.handle}`;

  return (
    <div className="mx-auto max-w-xl py-10">
      <Link href={`/${creator.handle}`} className="mb-5 inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" /> Back to profile
      </Link>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Make an offer to {name}</h1>
      <p className="mt-1.5 text-sm text-ink-2">Send a clear brief and budget. They have 48 hours to accept.</p>
      <div className="mt-7">
        <OfferForm
          handle={creator.handle}
          creatorName={name}
          startingRate={creator.starting_rate_naira ?? 0}
          initialTitle={spTitle ? spTitle.slice(0, 120) : undefined}
          initialPrice={spPrice ? Number(spPrice) || undefined : undefined}
        />
      </div>
    </div>
  );
}

export default function HirePage({ params, searchParams }: { params: Promise<{ handle: string }>; searchParams: Promise<{ title?: string; price?: string }> }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container>
          <Suspense fallback={<div className="py-20" />}>
            <HireInner params={params} searchParams={searchParams} />
          </Suspense>
        </Container>
      </main>
    </>
  );
}
