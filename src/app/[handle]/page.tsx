import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { CreatorProfile, type ProfileData } from "@/components/marketplace/creator-profile";
import { JsonLd, SITE_URL } from "@/components/seo/json-ld";
import { tierMeta } from "@/lib/tiers";
import { createClient } from "@/lib/supabase/server";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle: raw } = await params;
  const handle = cleanHandle(raw);
  let name = "Creator";
  let bio: string | null = null;
  let niches: string[] = [];

  if (handle === "demo") {
    name = DEMO.name;
    bio = DEMO.bio ?? null;
    niches = DEMO.niches;
  } else if (process.env.NEXT_PUBLIC_SUPABASE_URL && /^[a-z0-9._-]{3,30}$/.test(handle)) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("creator_profiles")
      .select("display_name, bio, niches, is_live")
      .eq("handle", handle)
      .maybeSingle();
    if (!data || !data.is_live) return { title: "Creator not found", robots: { index: false } };
    name = data.display_name || `@${handle}`;
    bio = data.bio;
    niches = data.niches ?? [];
  }

  const title = `${name} (@${handle}), UGC Creator`;
  const description =
    bio?.trim() ||
    `Hire ${name}, a verified UGC creator on UGCOrigin${niches.length ? ` for ${niches.slice(0, 3).join(", ")}` : ""}. Escrow-protected, Nigeria-first.`;
  const ogImage = `${SITE_URL}/card/${handle}`;

  return {
    title,
    description,
    alternates: { canonical: `/@${handle}` },
    openGraph: { title, description, type: "profile", images: [{ url: ogImage, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

function cleanHandle(h: string) {
  return decodeURIComponent(h).replace(/^@/, "").toLowerCase();
}

// A sample profile so the card can be previewed at /@demo without live data.
const DEMO: ProfileData = {
  handle: "demo",
  name: "Amara O.",
  bio: "Beauty & skincare UGC creator in Lagos. I make authentic testimonials, unboxings and tutorials that convert, raw and edited, delivered fast.",
  location: "Lagos, NG",
  niches: ["Beauty & Skincare", "Unboxing", "Testimonials"],
  verified: true,
  tier: "pro",
  startingRate: 45000,
  url: `${SITE}/@demo`,
  socials: [
    { platform: "instagram", handle: "amara.ugc" },
    { platform: "tiktok", handle: "amara.ugc" },
    { platform: "x", handle: "amara_ugc" },
  ],
  packages: [
    { id: "1", title: "Testimonial video", type: "paid", price_naira: 45000, revisions: 1, format: "30 to 45s vertical video" },
    { id: "2", title: "Unboxing + review", type: "paid", price_naira: 65000, revisions: 2, format: "60s vertical video" },
  ],
  reviews: [
    { id: "r1", rating: 5, body: "Amazing turnaround and the video converted instantly. Will rebook.", reviewer: "Verified brand" },
    { id: "r2", rating: 4.7, body: "Great communication and delivered right on time.", reviewer: "Verified brand" },
  ],
  averageRating: 4.9,
  embeds: [
    { id: "e1", platform: "youtube", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ" },
    { id: "e2", platform: "x", url: "https://twitter.com/Interior/status/463440424141459456" },
  ],
};

function profileLd(data: ProfileData) {
  const person: Record<string, unknown> = {
    "@type": "Person",
    name: data.name,
    url: data.url,
    image: `${SITE_URL}/card/${data.handle}`,
    jobTitle: "UGC Creator",
    address: { "@type": "PostalAddress", addressCountry: "NG", ...(data.location ? { addressLocality: data.location } : {}) },
    knowsAbout: data.niches,
  };
  if (data.reviews.length > 0) {
    person.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: data.averageRating.toFixed(1),
      reviewCount: data.reviews.length,
      bestRating: 5,
    };
  }
  if (data.startingRate) {
    person.makesOffer = { "@type": "Offer", priceCurrency: "NGN", price: data.startingRate, description: "Starting rate for UGC" };
  }
  return [
    { "@context": "https://schema.org", "@type": "ProfilePage", mainEntity: person },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Creators", item: `${SITE_URL}/creators` },
        { "@type": "ListItem", position: 3, name: data.name, item: data.url },
      ],
    },
  ];
}

async function ProfileInner({ params }: { params: Promise<{ handle: string }> }) {
  const { handle: raw } = await params;
  const handle = cleanHandle(raw);

  if (handle === "demo") {
    return (
      <>
        <JsonLd data={profileLd(DEMO)} />
        <CreatorProfile data={DEMO} />
      </>
    );
  }

  const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  let data: ProfileData | null = null;

  if (configured && /^[a-z0-9._-]{3,30}$/.test(handle)) {
    const supabase = await createClient();
    const { data: creator } = await supabase
      .from("creator_profiles")
      .select("id, handle, display_name, bio, location, niches, starting_rate_naira, verification_status, tier")
      .eq("handle", handle)
      .maybeSingle();

    if (creator) {
      const [{ data: socials }, { data: packages }, { data: reviewRows }, { data: portfolio }, { data: vids }] = await Promise.all([
        supabase.from("social_accounts").select("platform, handle, url").eq("creator_id", creator.id),
        supabase.from("packages").select("id, title, type, price_naira, revisions, format").eq("creator_id", creator.id).eq("active", true),
        supabase.from("reviews").select("id, rating_speed, rating_comms, rating_quality, body").eq("subject_id", creator.id).order("created_at", { ascending: false }).limit(12),
        supabase.from("portfolio_links").select("id, platform, url").eq("creator_id", creator.id).order("position", { ascending: true }),
        supabase.from("profile_videos").select("id, url, poster_url").eq("creator_id", creator.id).order("position", { ascending: true }),
      ]);
      const reviews = (reviewRows ?? []).map((r) => ({
        id: r.id,
        rating: (r.rating_speed + r.rating_comms + r.rating_quality) / 3,
        body: r.body,
        reviewer: "Verified brand",
      }));
      const averageRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
      data = {
        id: creator.id,
        handle: creator.handle,
        name: creator.display_name || `@${creator.handle}`,
        bio: creator.bio,
        location: creator.location,
        niches: creator.niches ?? [],
        verified: creator.verification_status === "verified",
        tier: creator.tier,
        startingRate: creator.starting_rate_naira,
        url: `${SITE}/@${creator.handle}`,
        socials: socials ?? [],
        packages: packages ?? [],
        reviews,
        averageRating,
        embeds: (portfolio ?? []).map((p) => ({ id: p.id, platform: p.platform, url: p.url })),
        videos: (vids ?? []).map((v) => ({ id: v.id, url: v.url, poster: v.poster_url })),
      };
    }
  }

  if (!data) notFound();

  return (
    <>
      <JsonLd data={profileLd(data)} />
      <CreatorProfile data={data} />
    </>
  );
}

export default function HandlePage({ params }: { params: Promise<{ handle: string }> }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container>
          <Suspense fallback={<div className="py-20" />}>
            <ProfileInner params={params} />
          </Suspense>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
