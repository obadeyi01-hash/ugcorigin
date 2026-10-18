import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { OfferForm } from "@/components/offers/offer-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Make an offer" };

async function HireInner({ params }: { params: Promise<{ handle: string }> }) {
  const { handle: raw } = await params;
  const handle = decodeURIComponent(raw).replace(/^@/, "").toLowerCase();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/dashboard");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
        <OfferForm handle={creator.handle} creatorName={name} startingRate={creator.starting_rate_naira ?? 0} />
      </div>
    </div>
  );
}

export default function HirePage({ params }: { params: Promise<{ handle: string }> }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container>
          <Suspense fallback={<div className="py-20" />}>
            <HireInner params={params} />
          </Suspense>
        </Container>
      </main>
    </>
  );
}
