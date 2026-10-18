import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Container } from "@/components/ui/container";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "New campaign" };

async function Inner() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/dashboard");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
