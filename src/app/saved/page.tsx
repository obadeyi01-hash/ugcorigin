import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { CreatorCard, type Creator } from "@/components/marketplace/creator-card";
import { createClient } from "@/lib/supabase/server";
import { publicName } from "@/lib/names";

export const metadata: Metadata = { title: "Saved creators", robots: { index: false } };

async function SavedInner() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/dashboard");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: brand } = await supabase.from("brand_profiles").select("id").eq("id", user.id).maybeSingle();
  if (!brand) redirect("/dashboard");

  const { data: rows } = await supabase
    .from("saved_creators")
    .select("creator_id, created_at, creator:creator_profiles(id, handle, display_name, first_name, last_name, location, niches, starting_rate_naira, verification_status, avatar_url)")
    .eq("brand_id", user.id)
    .order("created_at", { ascending: false });

  const creators: Creator[] = (rows ?? [])
    .map((r) => {
      const c = (Array.isArray(r.creator) ? r.creator[0] : r.creator) as {
        id: string; handle: string | null; display_name: string | null; first_name: string | null; last_name: string | null;
        location: string | null; niches: string[] | null; starting_rate_naira: number | null; verification_status: string; avatar_url: string | null;
      } | null;
      if (!c) return null;
      return {
        id: c.id,
        name: publicName({ first: c.first_name, last: c.last_name, display: c.display_name, handle: c.handle }),
        handle: c.handle ?? undefined,
        image: c.avatar_url || undefined,
        location: c.location ?? "Nigeria",
        niches: c.niches ?? [],
        startingRate: c.starting_rate_naira ?? 0,
        verified: c.verification_status === "verified",
        canSave: true,
        saved: true,
      } as Creator;
    })
    .filter(Boolean) as Creator[];

  return (
    <Container className="py-10 sm:py-14">
      <div className="flex items-center gap-2">
        <Heart className="size-5 text-accent" />
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Saved creators</h1>
      </div>
      <p className="mt-1.5 text-ink-2">Creators you&rsquo;ve saved. Build a shortlist, then hire when you&rsquo;re ready.</p>

      {creators.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-line bg-surface px-6 py-16 text-center">
          <p className="text-ink-2">You haven&rsquo;t saved anyone yet. Tap the heart on a creator to save them.</p>
          <Link href="/creators" className="mt-4 inline-block">
            <Button>Browse creators</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-3">
          {creators.map((c) => (
            <CreatorCard key={c.id ?? c.handle} creator={c} />
          ))}
        </div>
      )}
    </Container>
  );
}

export default function SavedPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Suspense fallback={<div className="min-h-dvh" />}>
          <SavedInner />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
