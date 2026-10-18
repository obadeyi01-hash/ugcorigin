import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { VerifyFlow } from "@/components/verify/verify-flow";
import { createClient } from "@/lib/supabase/server";
import { listBanks, paystackConfigured } from "@/lib/payments/paystack";
import { kycConfigured } from "@/lib/kyc";

export const metadata: Metadata = { title: "Go live" };

function Spinner() {
  return <span className="size-6 animate-spin rounded-full border-2 border-line border-t-accent" aria-label="Loading" />;
}

async function VerifyInner() {
  const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!configured) redirect("/dashboard");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: creator } = await supabase
    .from("creator_profiles")
    .select("handle, completeness, bank_verified, identity_verified, agreements_accepted_at, is_live, verification_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!creator) redirect("/onboarding?role=creator");
  if (creator.is_live) redirect("/dashboard");

  const banks = await listBanks();

  return (
    <VerifyFlow
      profile={{
        handle: creator.handle,
        completeness: creator.completeness ?? 0,
        bank_verified: !!creator.bank_verified,
        identity_verified: !!creator.identity_verified,
        agreements_accepted_at: creator.agreements_accepted_at ?? null,
        verification_status: creator.verification_status ?? "unverified",
      }}
      banks={banks}
      kycConfigured={kycConfigured()}
      paystackConfigured={paystackConfigured()}
    />
  );
}

export default function VerifyPage() {
  return (
    <div className="flex min-h-dvh flex-col px-6 py-8 sm:px-10">
      <Link href="/" aria-label="UGCOrigin home">
        <Logo variant="combined" size={30} />
      </Link>
      <div className="flex flex-1 items-start justify-center py-10">
        <Suspense fallback={<Spinner />}>
          <VerifyInner />
        </Suspense>
      </div>
    </div>
  );
}
