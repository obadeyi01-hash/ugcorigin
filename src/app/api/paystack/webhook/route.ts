import { NextResponse } from "next/server";
import { verifyWebhookSignature, verifyTransaction } from "@/lib/payments/paystack";
import { createAdminClient } from "@/lib/supabase/admin";
import { feeFor } from "@/lib/fees";
import { notifyUser, notifyMany } from "@/lib/notify";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Paystack webhook. Two jobs:
 *  - `charge.success`: bind money to intent. Every charge is RE-VERIFIED against
 *    Paystack (status + currency + amount) before anything is fulfilled — the
 *    signed body is never trusted for value. On a funding charge we create the
 *    gig + escrow + double-entry ledger via the SERVICE ROLE, idempotently.
 *  - `transfer.*`: finalize the creator payout record so a paid/failed transfer
 *    is never left silently stuck at "processing".
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  if (!verifyWebhookSignature(raw, signature)) {
    return new NextResponse("invalid signature", { status: 401 });
  }

  let event: {
    event?: string;
    data?: {
      reference?: string;
      status?: string;
      metadata?: { offerId?: string; campaignId?: string; boostId?: string; subscriptionId?: string };
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return new NextResponse("bad json", { status: 400 });
  }

  const admin = createAdminClient();
  const type = event.event;

  // Payout (transfer) lifecycle — close the loop on creator payouts.
  if (type === "transfer.success" || type === "transfer.failed" || type === "transfer.reversed") {
    return handleTransferEvent(admin, type, event.data?.reference ?? null);
  }

  if (type !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const reference = event.data?.reference ?? null;
  if (!reference) return NextResponse.json({ received: true });

  // Re-verify server-side. Never fulfil on the webhook body alone.
  let verified;
  try {
    verified = await verifyTransaction(reference);
  } catch {
    // Transient (network/API) — let Paystack retry.
    return new NextResponse("verify failed", { status: 500 });
  }
  if (verified.status !== "success" || verified.currency !== "NGN") {
    return NextResponse.json({ received: true, ignored: "unverified" });
  }
  const paid = verified.amountNaira; // Naira actually paid, per Paystack.

  const campaignId = event.data?.metadata?.campaignId;
  const offerId = event.data?.metadata?.offerId;
  const boostId = event.data?.metadata?.boostId;
  const subscriptionId = event.data?.metadata?.subscriptionId;

  // Creator Pro subscription: activate for 30 days from now (idempotent).
  if (subscriptionId) {
    const { data: s } = await admin
      .from("subscriptions")
      .select("id, user_id, status, amount_naira")
      .eq("id", subscriptionId)
      .maybeSingle();
    if (s && s.status === "pending") {
      if (paid < s.amount_naira) return NextResponse.json({ received: true, ignored: "underpaid" });
      const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await admin
        .from("subscriptions")
        .update({ status: "active", current_period_end: periodEnd, provider_ref: reference, updated_at: new Date().toISOString() })
        .eq("id", subscriptionId)
        .eq("status", "pending");
      await admin.from("notifications").insert({
        user_id: s.user_id,
        type: "product",
        title: "Welcome to Creator Pro",
        body: "Your Pro membership is active. Enjoy your perks for the next 30 days.",
        href: "/pro",
      });
    }
    return NextResponse.json({ received: true });
  }

  // Featured boost, activate for `days` from now (idempotent).
  if (boostId) {
    const { data: b } = await admin
      .from("boosts")
      .select("id, owner_id, target_type, target_id, days, amount_naira, status")
      .eq("id", boostId)
      .maybeSingle();
    if (b && b.status === "pending") {
      if (paid < b.amount_naira) return NextResponse.json({ received: true, ignored: "underpaid" });
      const ends = new Date(Date.now() + b.days * 24 * 60 * 60 * 1000).toISOString();
      await admin
        .from("boosts")
        .update({ status: "active", starts_at: new Date().toISOString(), ends_at: ends, provider_ref: reference, updated_at: new Date().toISOString() })
        .eq("id", boostId)
        .eq("status", "pending");
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
      if (paid < c.pool_naira + feeFor(c.pool_naira)) return NextResponse.json({ received: true, ignored: "underpaid" });
      await admin.from("campaigns").update({ funded: true, status: "open", provider_ref: reference }).eq("id", campaignId).eq("funded", false);
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
  // The brand must have paid at least the rate + platform fee, else don't bind escrow.
  if (paid < offer.price_naira + fee) {
    return NextResponse.json({ received: true, ignored: "underpaid" });
  }

  const { data: gig, error: gigErr } = await admin
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
      needs_location: !!offer.needs_location,
      location_address: offer.location_address ?? null,
      location_status: offer.needs_location ? "scheduled" : null,
    })
    .select("id")
    .single();
  // A concurrent webhook delivery may have created the gig first (unique offer_id).
  if (gigErr || !gig) return NextResponse.json({ received: true, already: true });

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

/**
 * Finalize a creator payout from a signed transfer event. Our payouts set the
 * Paystack transfer reference to `pay_<payoutId>`, so we match on that.
 */
async function handleTransferEvent(
  admin: Admin,
  type: "transfer.success" | "transfer.failed" | "transfer.reversed",
  reference: string | null,
) {
  if (!reference || !reference.startsWith("pay_")) return NextResponse.json({ received: true });

  const { data: payout } = await admin
    .from("payouts")
    .select("id, creator_id, gig_id, amount_naira, status")
    .eq("provider_ref", reference)
    .maybeSingle();
  if (!payout) return NextResponse.json({ received: true });
  if (payout.status === "paid" || payout.status === "failed") {
    return NextResponse.json({ received: true, already: true }); // idempotent
  }

  const href = payout.gig_id ? `/gigs/${payout.gig_id}` : "/dashboard";

  if (type === "transfer.success") {
    await admin.from("payouts").update({ status: "paid" }).eq("id", payout.id).neq("status", "paid");
    await notifyUser(admin, payout.creator_id, {
      type: "payout",
      title: "You've been paid",
      body: `Your payout of ₦${payout.amount_naira.toLocaleString("en-NG")} has landed in your bank account.`,
      href,
      ctaLabel: "View details",
    });
    return NextResponse.json({ received: true });
  }

  // transfer.failed | transfer.reversed — the money did not reach the creator.
  // Leave it recoverable (manual retry from the admin console) and tell the creator.
  await admin.from("payouts").update({ status: "failed" }).eq("id", payout.id).neq("status", "paid");
  await notifyUser(admin, payout.creator_id, {
    type: "payout",
    title: "Payout needs attention",
    body: "Your bank transfer didn't go through. We're on it — please confirm your payout bank details are correct.",
    href: "/settings",
    ctaLabel: "Check payout details",
  });
  return NextResponse.json({ received: true });
}
