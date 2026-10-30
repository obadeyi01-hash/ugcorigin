import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { CalendarClock, MapPin, Users } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { DetailSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { BrandByline, BriefTagList, PRIVATE_BRAND } from "@/components/briefs/brief-facts";
import { ApplyForm } from "@/components/briefs/apply-form";
import { ApplicationsList, type AppRow } from "@/components/briefs/applications-list";
import { BoostButton } from "@/components/boost/boost-button";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/role";
import { formatNaira } from "@/lib/utils";
import { Notice } from "@/components/ui/notice";
import { JsonLd, SITE_URL } from "@/components/seo/json-ld";
import { createAdminClient } from "@/lib/supabase/admin";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { title: "Brief" };
  const { data } = await createAdminClient()
    .from("briefs")
    .select("title, description, status, brand:brand_profiles!inner(verification_status)")
    .eq("id", id)
    .maybeSingle();
  const brand = data?.brand as { verification_status?: string } | { verification_status?: string }[] | null;
  const verified = Array.isArray(brand) ? brand[0]?.verification_status === "verified" : brand?.verification_status === "verified";
  if (!data || data.status !== "open" || !verified) return { title: "Brief", robots: { index: false, follow: false } };
  const description = (data.description ?? "").replace(/\s+/g, " ").trim().slice(0, 160);
  return {
    title: data.title,
    description,
    alternates: { canonical: `/briefs/${id}` },
    openGraph: { title: data.title, description, url: `/briefs/${id}` },
  };
}

async function BriefInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return <div className="py-20 text-center text-ink-2">Connect Supabase to view briefs.</div>;
  }
  const supabase = await createClient();

  const { data: brief } = await supabase
    .from("briefs")
    .select("id, brand_id, title, description, budget_naira, slots, deadline, location, format, niches, tags, conceal_brand, status, created_at, brand:brand_profiles(company_name)")
    .eq("id", id)
    .maybeSingle();

  if (!brief) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">Brief not found</h1>
        <Link href="/briefs" className="mt-5 inline-block"><Button variant="secondary">Browse briefs</Button></Link>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = !!user && brief.brand_id === user.id;
  // Applying is a creator action — hide the form from brand-only accounts.
  const { showCreatorCtas, isCreator, creatorLive } = await getViewer();
  const conceal = !!(brief as { conceal_brand?: boolean }).conceal_brand;
  const companyName = (brief as unknown as { brand?: { company_name: string | null } }).brand?.company_name ?? null;
  // Never name the company in structured data when the brief is masked; RLS
  // also nulls the join for viewers who aren't the brand, an admin, or hired.
  const company = conceal ? PRIVATE_BRAND : (companyName || "A brand");
  const location = (brief as { location?: string | null }).location ?? null;
  const format = (brief as { format?: string | null }).format ?? null;
  const tags = (brief as { tags?: string[] | null }).tags ?? [];

  let apps: AppRow[] = [];
  let myAppStatus: string | null = null;
  if (isOwner) {
    const { data } = await supabase
      .from("applications")
      .select("id, pitch, sample_url, status, creator:creator_profiles(handle, display_name)")
      .eq("brief_id", id)
      .order("created_at", { ascending: true });
    apps = (data ?? []).map((a) => {
      const c = (a as unknown as { creator?: { handle: string | null; display_name: string | null } }).creator;
      return {
        id: a.id,
        pitch: a.pitch,
        sample_url: a.sample_url,
        status: a.status,
        creatorHandle: c?.handle ?? null,
        creatorName: c?.display_name || (c?.handle ? `@${c.handle}` : "Creator"),
      };
    });
  } else if (user) {
    const { data: mine } = await supabase.from("applications").select("status").eq("brief_id", id).eq("creator_id", user.id).maybeSingle();
    myAppStatus = mine?.status ?? null;
  }

  const posted = (brief as { created_at?: string }).created_at;
  const jobLd = brief.status === "open" && brief.budget_naira ? {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: brief.title,
    description: brief.description ?? brief.title,
    datePosted: posted ? posted.slice(0, 10) : undefined,
    validThrough: brief.deadline ?? undefined,
    employmentType: "CONTRACTOR",
    directApply: true,
    hiringOrganization: { "@type": "Organization", name: company, url: SITE_URL },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressCountry: "NG" } },
    applicantLocationRequirements: { "@type": "Country", name: "Nigeria" },
    baseSalary: {
      "@type": "MonetaryAmount",
      currency: "NGN",
      value: { "@type": "QuantitativeValue", value: brief.budget_naira, unitText: "VIDEO" },
    },
    url: `${SITE_URL}/briefs/${id}`,
  } : null;

  return (
    <div className="grid gap-8 py-10 md:grid-cols-[1fr_340px]">
      {jobLd && <JsonLd data={jobLd} />}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">{brief.title}</h1>
        <div className="mt-1.5"><BrandByline conceal={conceal} company={companyName} /></div>
        <div className="mt-4">
          <BriefTagList location={location} format={format} niches={brief.niches ?? []} tags={tags} />
        </div>
        {brief.description && <p className="mt-6 max-w-prose whitespace-pre-line leading-relaxed text-ink-2">{brief.description}</p>}

        {isOwner && (
          <div className="mt-10">
            <h2 className="font-display text-lg font-semibold text-ink">Applications ({apps.length})</h2>
            <div className="mt-4"><ApplicationsList apps={apps} /></div>
          </div>
        )}
      </div>

      <aside>
        <Card className="md:sticky md:top-20">
          <CardBody>
            <p className="text-xs text-ink-3">Budget per creator</p>
            <p className="font-display text-3xl font-bold text-ink">{brief.budget_naira ? formatNaira(brief.budget_naira) : "Open budget"}</p>
            <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-2"><Users className="size-4" /> {brief.slots} creator{brief.slots === 1 ? "" : "s"} needed</p>
            {location && <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-2"><MapPin className="size-4" /> {location}</p>}
            {brief.deadline && <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-2"><CalendarClock className="size-4" /> Due {brief.deadline}</p>}

            {isOwner && brief.status === "open" && (
              <div className="mt-5">
                <BoostButton targetType="brief" targetId={id} label="Boost this brief" variant="secondary" size="sm" />
                <p className="mt-2 text-xs text-ink-3">Feature it so more creators see and apply.</p>
              </div>
            )}

            {!isOwner && brief.status === "open" && showCreatorCtas && isCreator && !creatorLive && (
              <div className="mt-5">
                <Notice tone="warning" title="You're not live yet" href="/verify" action="Finish verification">
                  Brands cannot see you, and applications stay closed until verification is done.
                </Notice>
              </div>
            )}
            {!isOwner && brief.status === "open" && showCreatorCtas && (!isCreator || creatorLive) && (
              <div className="mt-5">
                {myAppStatus ? (
                  <div className="rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-ink">
                    You&apos;ve applied, status: <span className="font-medium capitalize">{myAppStatus}</span>.
                  </div>
                ) : (
                  <ApplyForm briefId={id} />
                )}
              </div>
            )}
            {!isOwner && brief.status === "open" && !showCreatorCtas && (
              <p className="mt-5 text-sm text-ink-3">Creators apply to briefs. To work with a creator directly, make them an offer from their profile.</p>
            )}
            {!isOwner && brief.status !== "open" && <p className="mt-5 text-sm text-ink-3">This brief is closed.</p>}
          </CardBody>
        </Card>
      </aside>
    </div>
  );
}

export default function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container>
          <Suspense fallback={<DetailSkeleton />}>
            <BriefInner params={params} />
          </Suspense>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
