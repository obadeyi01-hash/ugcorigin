"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { initTransaction, paystackConfigured } from "@/lib/payments/paystack";
import { feeFor } from "@/lib/fees";

async function auth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export type SendOfferInput = {
  handle: string;
  title: string;
  brief: string;
  price: number;
  deadline: string; // YYYY-MM-DD
  needsProduct?: boolean;
  needsLocation?: boolean;
  locationAddress?: string;
};

export async function sendOfferAction(input: SendOfferInput): Promise<{ error?: string; needsBrand?: boolean }> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in to send an offer." };

  const { data: brand } = await supabase.from("brand_profiles").select("id").eq("id", user.id).maybeSingle();
  if (!brand) return { error: "Create a brand account first.", needsBrand: true };

  const handle = input.handle.replace(/^@/, "").toLowerCase();
  const { data: creator } = await supabase
    .from("creator_profiles")
    .select("id, is_live")
    .eq("handle", handle)
    .maybeSingle();
  if (!creator) return { error: "That creator could not be found." };
  if (creator.id === user.id) return { error: "You can't hire your own creator profile." };

  if (!input.title.trim()) return { error: "Add a short title." };
  if (!(input.price > 0)) return { error: "Enter a valid budget." };

  const expires = new Date();
  expires.setHours(expires.getHours() + 48);

  const { error } = await supabase.from("offers").insert({
    brand_id: user.id,
    creator_id: creator.id,
    title: input.title.trim(),
    brief: input.brief.trim(),
    price_naira: Math.round(input.price),
    deadline: input.deadline || null,
    status: "pending",
    needs_product: !!input.needsProduct,
    needs_location: !!input.needsLocation,
    location_address: input.needsLocation ? (input.locationAddress ?? "").trim() || null : null,
    expires_at: expires.toISOString(),
  });
  if (error) return { error: error.message };

  revalidatePath("/offers");
  redirect("/offers?sent=1");
}

export async function acceptOfferAction(offerId: string): Promise<{ error?: string }> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in again." };

  const { data: offer } = await supabase
    .from("offers")
    .select("id, creator_id, status, expires_at")
    .eq("id", offerId)
    .maybeSingle();
  if (!offer || offer.creator_id !== user.id) return { error: "Offer not found." };
  if (offer.status !== "pending") return { error: "This offer can no longer be accepted." };
  if (offer.expires_at && new Date(offer.expires_at).getTime() < Date.now()) {
    return { error: "This offer has expired." };
  }

  const { error } = await supabase.from("offers").update({ status: "accepted" }).eq("id", offerId);
  if (error) return { error: error.message };
  revalidatePath("/offers");
  return {};
}

export async function declineOfferAction(offerId: string): Promise<{ error?: string }> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in again." };

  const { data: offer } = await supabase
    .from("offers")
    .select("id, creator_id, brand_id, status")
    .eq("id", offerId)
    .maybeSingle();
  if (!offer) return { error: "Offer not found." };
  if (offer.creator_id !== user.id && offer.brand_id !== user.id) return { error: "Not allowed." };

  const next = offer.creator_id === user.id ? "declined" : "withdrawn";
  const { error } = await supabase.from("offers").update({ status: next }).eq("id", offerId);
  if (error) return { error: error.message };
  revalidatePath("/offers");
  return {};
}

export async function fundOfferAction(offerId: string): Promise<{ url?: string; configured?: boolean; error?: string }> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in again." };

  const { data: offer } = await supabase
    .from("offers")
    .select("id, brand_id, status, title, price_naira")
    .eq("id", offerId)
    .maybeSingle();
  if (!offer || offer.brand_id !== user.id) return { error: "Offer not found." };
  if (offer.status !== "accepted") return { error: "This offer isn't ready to fund yet." };

  if (!paystackConfigured()) return { configured: false };

  const amount = offer.price_naira + feeFor(offer.price_naira);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ugcorigin.com";
  try {
    const { authorizationUrl } = await initTransaction({
      email: user.email ?? `brand+${user.id}@ugcorigin.com`,
      amountNaira: amount,
      reference: `off_${offerId}_${Date.now()}`,
      metadata: { offerId, kind: "escrow_funding" },
      callbackUrl: `${siteUrl}/offers?funded=1`,
    });
    return { url: authorizationUrl };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not start payment." };
  }
}
