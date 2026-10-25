"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { initTransaction, paystackConfigured } from "@/lib/payments/paystack";
import { PRO_PLAN, PRO_PRICE_NAIRA } from "@/lib/pro";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ugcorigin.com";

/** Start a Paystack checkout to subscribe to Creator Pro. */
export async function startSubscription(): Promise<{ url?: string; configured?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };
  if (!user.email) return { error: "Your account needs an email to subscribe." };
  if (!paystackConfigured()) return { configured: false };

  const admin = createAdminClient();
  const { data: sub, error } = await admin
    .from("subscriptions")
    .insert({ user_id: user.id, plan: PRO_PLAN, status: "pending", amount_naira: PRO_PRICE_NAIRA })
    .select("id")
    .single();
  if (error || !sub) return { error: error?.message ?? "Could not start checkout." };

  try {
    const { authorizationUrl } = await initTransaction({
      email: user.email,
      amountNaira: PRO_PRICE_NAIRA,
      reference: `sub_${sub.id}`,
      metadata: { subscriptionId: sub.id, type: "subscription" },
      callbackUrl: `${SITE}/pro?done=1`,
    });
    return { url: authorizationUrl };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not start checkout." };
  }
}
