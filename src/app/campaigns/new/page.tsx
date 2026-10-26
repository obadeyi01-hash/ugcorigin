import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Container } from "@/components/ui/container";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { AccessNotice } from "@/components/layout/access-notice";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/role";

export const metadata: Metadata = { title: "New campaign" };

async function Inner() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/dashboard");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { isBrand, brandVerified } = await getViewer();
  if (!isBrand) {
    return (
      <AccessNotice
        title="Brands run campaigns"
        message="You're signed in as a creator. Per-view campaigns are funded by brands — add a brand account to create one, or browse open campaigns to submit."
        cta={{ label: "Add a brand account", href: "/onboarding?role=brand" }}
      />
    );
  }
  if (!brandVerified) {
    return (
      <AccessNotice
        title="Verify your brand first"
        message="Campaigns stay hidden until your CAC/RC number is approved. Creators only work with verified businesses."
        cta={{ label: "Verify your brand", href: "/settings" }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-xl py-10">
      <Link href="/campaigns" className="mb-5 inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink"><ArrowLeft className="size-4" /> Back to campaigns</Link>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">New per-view campaign</h1>
      <p className="mt-1.5 text-sm text-ink-2">Fund a pool and pay creators per 1,000 views.</p>
      <div className="mt-7"><CampaignForm /></div>
    </div>
  );
}

export default function NewCampaignPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1"><Container><Suspense fallback={<div className="py-20" />}><Inner /></Suspense></Container></main>
    </>
  );
}
