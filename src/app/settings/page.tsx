import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SettingsForm } from "@/components/settings/settings-form";

export const metadata: Metadata = { title: "Settings" };

function SettingsSkeleton() {
  return (
    <Container className="py-12">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-surface-2" />
      <div className="mt-8 max-w-2xl space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-2" />
        ))}
      </div>
    </Container>
  );
}

async function SettingsInner() {
  const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!configured) redirect("/dashboard");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // The owner's own profile rows include PII (phone, rc_number) whose SELECT is
  // revoked from anon/authenticated at the column level. Read them through the
  // service-role client, strictly scoped to the signed-in user's own id.
  const admin = createAdminClient();
  const [{ data: creator }, { data: brand }, { data: settings }] = await Promise.all([
    admin
      .from("creator_profiles")
      .select("handle, first_name, last_name, display_name, bio, location, phone, niches, content_formats, starting_rate_naira, avatar_url, tier, identity_verified, verification_status")
      .eq("id", user.id)
      .maybeSingle(),
    admin
      .from("brand_profiles")
      .select("company_name, contact_first_name, contact_last_name, website, store_url, phone, logo_url, verification_status, rc_number, goal, ad_platforms, content_types, business_type, contact_role, team_size")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("user_settings")
      .select("notify_offers, notify_payouts, notify_reviews, notify_product")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!creator && !brand) redirect("/onboarding");

  const prefs = settings ?? {
    notify_offers: true,
    notify_payouts: true,
    notify_reviews: true,
    notify_product: false,
  };

  return (
    <Container className="py-12">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Settings</h1>
      <p className="mt-1 text-sm text-ink-2">Manage your profile, image and notifications.</p>
      <div className="mt-8 max-w-2xl">
        <SettingsForm
          userId={user.id}
          email={user.email ?? ""}
          role={creator ? "creator" : "brand"}
          creator={creator ?? null}
          brand={brand ?? null}
          prefs={prefs}
        />
      </div>
    </Container>
  );
}

export default function SettingsPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Suspense fallback={<SettingsSkeleton />}>
          <SettingsInner />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
