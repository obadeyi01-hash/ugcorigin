import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Get started" };

function Spinner() {
  return (
    <span className="size-6 animate-spin rounded-full border-2 border-line border-t-accent" aria-label="Loading" />
  );
}

async function OnboardingInner({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;
  const initialRole = role === "brand" ? "brand" : role === "creator" ? "creator" : null;
  const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (configured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const [{ data: creator }, { data: brand }] = await Promise.all([
      supabase.from("creator_profiles").select("id").eq("id", user.id).maybeSingle(),
      supabase.from("brand_profiles").select("id").eq("id", user.id).maybeSingle(),
    ]);
    // One email can run both personas as distinct profiles. Only block if the
    // user already has the persona they're trying to create (or both, with no
    // specific role requested).
    if (initialRole === "creator" && creator) redirect("/dashboard");
    if (initialRole === "brand" && brand) redirect("/dashboard");
    if (!initialRole && (creator || brand)) redirect("/dashboard");
  }

  return <OnboardingWizard initialRole={initialRole} preview={!configured} />;
}

export default function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  return (
    <div className="flex min-h-dvh flex-col px-6 py-8 sm:px-10">
      <Link href="/" aria-label="UGCOrigin home">
        <Logo variant="combined" size={30} />
      </Link>
      <div className="flex flex-1 items-center justify-center py-10">
        <Suspense fallback={<Spinner />}>
          <OnboardingInner searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
