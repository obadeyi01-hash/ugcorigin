import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/paystack";
import { createAdminClient } from "@/lib/supabase/admin";
import { feeFor } from "@/lib/fees";
import { notifyMany } from "@/lib/notify";

/**
 * Paystack webhook. On `charge.success` for an escrow-funding payment, create the
 * gig + escrow + double-entry ledger via the SERVICE ROLE, idempotently. This is
 * the only place a gig is created, money and gig are bound together.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  if (!verifyWebhookSignature(raw, signature)) {
    return new NextResponse("invalid signature", { status: 401 });
  }

  let event: {
    event?: string;
    data?: { reference?: string; metadata?: { offerId?: string; campaignId?: string; boostId?: string } };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return new NextResponse("bad json", { status: 400 });
  }

  if (event.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const reference = event.data?.reference ?? null;
  const campaignId = event.data?.metadata?.campaignId;
  const offerId = event.data?.metadata?.offerId;
  const boostId = event.data?.metadata?.boostId;

  const admin = createAdminClient();

  // Featured boost, activate for `days` from now (idempotent).
  if (boostId) {
    const { data: b } = await admin
      .from("boosts")
      .select("id, owner_id, target_type, target_id, days, status")
      .eq("id", boostId)
      .maybeSingle();
    if (b && b.status === "pending") {
      const ends = new Date(Date.now() + b.days * 24 * 60 * 60 * 1000).toISOString();
      await admin
        .from("boosts")
        .update({ status: "active", starts_at: new Date().toISOString(), ends_at: ends, provider_ref: reference, updated_at: new Date().toISOString() })
        .eq("id", boostId);
      await admin.from("notifications").insert({
        user_id: b.owner_id,
        type: "boost_active",
        title: "Your boost is live",
        body: `Your ${b.target_type} is now featured for ${b.days} days.`,
        href: b.target_type === "creator" ? "/dashboard" : `/${b.target_type}s/${b.target_id}`,
      });
    }
    return NextResponse.json({ received: true });
  }

  // Campaign pool funding.
  if (campaignId) {
    const { data: c } = await admin.from("campaigns").select("id, funded, pool_naira").eq("id", campaignId).maybeSingle();
    if (c && !c.funded) {
      await admin.from("campaigns").update({ funded: true, status: "open", provider_ref: reference }).eq("id", campaignId);
      await admin.from("ledger_entries").insert({ entry_type: "escrow_in", amount_naira: c.pool_naira, memo: `Campaign pool funded (${campaignId})` });
    }
    return NextResponse.json({ received: true });
  }

  if (!offerId) return NextResponse.json({ received: true });

  // Idempotency: only create one gig per offer.
  const { data: existing } = await admin.from("gigs").select("id").eq("offer_id", offerId).maybeSingle();
  if (existing) return NextResponse.json({ received: true, already: true });

  const { data: offer } = await admin.from("offers").select("*").eq("id", offerId).maybeSingle();
  if (!offer) return NextResponse.json({ received: true });

  const fee = feeFor(offer.price_naira);

  const { data: gig } = await admin
    .from("gigs")
    .insert({
      brand_id: offer.brand_id,
      creator_id: offer.creator_id,
      offer_id: offer.id,
      title: offer.title,
      price_naira: offer.price_naira,
      fee_naira: fee,
      status: "funded",
      review_window_days: 7,
      deadline: offer.deadline ?? null,
      needs_product: !!offer.needs_product,
      shipping_status: offer.needs_product ? "awaiting_address" : null,
    })
    .select("id")
    .single();
  if (!gig) return NextResponse.json({ received: true });

  const { data: esc } = await admin
    .from("escrow_transactions")
    .insert({
      gig_id: gig.id,
      provider: "paystack",
      provider_ref: reference,
      amount_naira: offer.price_naira,
      fee_naira: fee,
      status: "held",
    })
    .select("id")
    .single();

  await admin.from("ledger_entries").insert([
    { gig_id: gig.id, escrow_id: esc?.id, entry_type: "escrow_in", amount_naira: offer.price_naira + fee, memo: "Brand funded escrow" },
    { gig_id: gig.id, escrow_id: esc?.id, entry_type: "fee", amount_naira: fee, memo: "Platform fee" },
    { gig_id: gig.id, escrow_id: esc?.id, entry_type: "hold", amount_naira: offer.price_naira, memo: "Held for creator" },
  ]);

  await notifyMany(admin, [
    { userId: offer.creator_id, payload: { type: "gig_update", title: "You've been hired", body: `"${offer.title}" is funded and ready to start.`, href: `/gigs/${gig.id}`, ctaLabel: "Start the gig" } },
    { userId: offer.brand_id, payload: { type: "gig_update", title: "Escrow funded", body: `"${offer.title}" is funded. The creator can start now.`, href: `/gigs/${gig.id}`, ctaLabel: "View the gig" } },
  ]);

  return NextResponse.json({ received: true });
}
