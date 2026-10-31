import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Container } from "@/components/ui/container";
import { BriefForm } from "@/components/briefs/brief-form";
import { AccessNotice } from "@/components/layout/access-notice";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/role";

export const metadata: Metadata = { title: "Post a brief" };

async function NewBriefInner() {
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
        title="Brands post briefs"
        message="You're signed in as a creator. Briefs are posted by brands, add a brand account to post one, or browse open briefs to apply."
        cta={{ label: "Add a brand account", href: "/onboarding?role=brand" }}
      />
    );
  }
  if (!brandVerified) {
    return (
      <AccessNotice
        title="Verify your brand first"
        message="Briefs stay off the marketplace until your CAC/RC number is approved."
        cta={{ label: "Verify your brand", href: "/settings" }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-xl py-10">
      <Link href="/briefs" className="mb-5 inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" /> Back to briefs
      </Link>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Post a brief</h1>
      <p className="mt-1.5 text-sm text-ink-2">Describe your campaign and let verified creators apply.</p>
      <div className="mt-7">
        <BriefForm />
      </div>
    </div>
  );
}

export default function NewBriefPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container>
          <Suspense fallback={<div className="py-20" />}>
            <NewBriefInner />
          </Suspense>
        </Container>
      </main>
    </>
  );
}
