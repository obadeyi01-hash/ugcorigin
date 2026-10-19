"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paystackConfigured, initiateTransfer } from "@/lib/payments/paystack";
import { deliverableFolder } from "@/lib/cloudinary";
import { signedUpload, type SignedUpload } from "@/lib/cloudinary-server";
import { notifyUser, notifyMany } from "@/lib/notify";

async function auth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Creator-only: sign a Cloudinary upload for a deliverable (authenticated). */
export async function signDeliverableUpload(
  gigId: string,
): Promise<{ upload?: SignedUpload; error?: string }> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in again." };

  const { data: gig } = await supabase.from("gigs").select("id, creator_id, status").eq("id", gigId).maybeSingle();
  if (!gig || gig.creator_id !== user.id) return { error: "Not allowed." };

  const upload = signedUpload(deliverableFolder(gigId));
  if (!upload) return { error: "Uploads aren’t configured yet." };
  return { upload };
}

/** Creator-only: record a submitted deliverable (after the file is uploaded). */
export async function recordDeliverableAction(
  gigId: string,
  path: string,
  note: string,
): Promise<{ error?: string }> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in again." };

  const { data: gig } = await supabase.from("gigs").select("id, creator_id, brand_id, title").eq("id", gigId).maybeSingle();
  if (!gig || gig.creator_id !== user.id) return { error: "Not allowed." };

  const admin = createAdminClient();
  const { count } = await admin.from("deliverables").select("id", { count: "exact", head: true }).eq("gig_id", gigId);

  const { error } = await admin.from("deliverables").insert({
    gig_id: gigId,
    version: (count ?? 0) + 1,
    file_url: path,
    watermarked: true,
    status: "submitted",
    note: note.trim() || null,
  });
  if (error) return { error: error.message };

  await admin.from("gigs").update({ status: "in_review" }).eq("id", gigId);
  await notifyUser(admin, gig.brand_id, {
    type: "draft_submitted",
    title: "A draft is ready to review",
    body: `"${gig.title}" has a new draft for your feedback.`,
    href: `/gigs/${gigId}`,
    ctaLabel: "Review the draft",
  });

  revalidatePath(`/gigs/${gigId}`);
  return {};
}

/** Either party: add a time-stamped comment on a deliverable. */
export async function addCommentAction(
  deliverableId: string,
  timecodeSecs: number,
  body: string,
): Promise<{ error?: string }> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in again." };
  if (!body.trim()) return { error: "Write a comment." };

  const { error } = await supabase.from("deliverable_comments").insert({
    deliverable_id: deliverableId,
    author_id: user.id,
    timecode_secs: Math.max(0, Math.round(timecodeSecs * 100) / 100),
    body: body.trim(),
  });
  if (error) return { error: error.message };
  return {};
}

/** Brand-only: ask for a revision. */
export async function requestRevisionAction(gigId: string, deliverableId: string): Promise<{ error?: string }> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in again." };

  const { data: gig } = await supabase.from("gigs").select("id, brand_id, creator_id, title").eq("id", gigId).maybeSingle();
  if (!gig || gig.brand_id !== user.id) return { error: "Not allowed." };

  const admin = createAdminClient();
  await admin.from("deliverables").update({ status: "revision_requested" }).eq("id", deliverableId);
  await admin.from("gigs").update({ status: "revision" }).eq("id", gigId);
  await notifyUser(admin, gig.creator_id, {
    type: "revision_requested",
    title: "Revision requested",
    body: `The brand asked for changes on "${gig.title}".`,
    href: `/gigs/${gigId}`,
    ctaLabel: "See the feedback",
  });
  revalidatePath(`/gigs/${gigId}`);
  return {};
}

/** Brand-only: approve the work → release escrow → queue creator payout. */
export async function approveReleaseAction(
  gigId: string,
  deliverableId: string,
): Promise<{ ok?: boolean; payoutQueued?: boolean; error?: string }> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in again." };

  const { data: gig } = await supabase
    .from("gigs")
    .select("id, brand_id, creator_id, title, price_naira, status")
    .eq("id", gigId)
    .maybeSingle();
  if (!gig || gig.brand_id !== user.id) return { error: "Not allowed." };
  if (gig.status === "completed") return { ok: true };

  const admin = createAdminClient();

  // Approve the deliverable + complete the gig.
  await admin.from("deliverables").update({ status: "approved" }).eq("id", deliverableId);
  await admin.from("gigs").update({ status: "completed" }).eq("id", gigId);

  // Release escrow + ledger.
  const { data: esc } = await admin
    .from("escrow_transactions")
    .update({ status: "released" })
    .eq("gig_id", gigId)
    .select("id")
    .maybeSingle();
  await admin.from("ledger_entries").insert([
    { gig_id: gigId, escrow_id: esc?.id, user_id: gig.creator_id, entry_type: "release", amount_naira: gig.price_naira, memo: "Released to creator on approval" },
    { gig_id: gigId, escrow_id: esc?.id, user_id: gig.creator_id, entry_type: "payout", amount_naira: gig.price_naira, memo: "Payout queued to creator" },
  ]);

  // Create the payout record; attempt the transfer if Paystack + a recipient exist.
  const { data: creator } = await admin
    .from("creator_profiles")
    .select("payout_recipient_code")
    .eq("id", gig.creator_id)
    .maybeSingle();

  const { data: payout } = await admin
    .from("payouts")
    .insert({ creator_id: gig.creator_id, gig_id: gigId, provider: "paystack", amount_naira: gig.price_naira, status: "pending" })
    .select("id")
    .single();

  let payoutQueued = false;
  if (paystackConfigured() && creator?.payout_recipient_code && payout) {
    try {
      const t = await initiateTransfer({
        amountNaira: gig.price_naira,
        recipientCode: creator.payout_recipient_code,
        reason: `UGCOrigin payout, ${gig.title}`,
        reference: `pay_${payout.id}`,
      });
      await admin.from("payouts").update({ status: "processing", provider_ref: t.reference }).eq("id", payout.id);
      payoutQueued = true;
    } catch {
      // leave payout pending for manual retry
    }
  }

  await notifyMany(admin, [
    { userId: gig.creator_id, payload: { type: "payout", title: "Your work was approved", body: `"${gig.title}" was approved, your payout is on the way.`, href: `/gigs/${gigId}`, ctaLabel: "View the gig" } },
    { userId: gig.brand_id, payload: { type: "gig_update", title: "Content approved", body: `You approved "${gig.title}". Final files are unlocked.`, href: `/gigs/${gigId}`, ctaLabel: "View the gig" } },
  ]);

  revalidatePath(`/gigs/${gigId}`);
  return { ok: true, payoutQueued };
}

// ---- Physical-product logistics --------------------------------------------

/** Creator sets the delivery address for a physical-product gig. */
export async function setShippingAddressAction(gigId: string, address: string): Promise<{ error?: string; ok?: boolean }> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in again." };
  const addr = address.trim();
  if (addr.length < 8) return { error: "Please enter a complete delivery address." };

  const { data: gig } = await supabase.from("gigs").select("id, creator_id, brand_id, title, needs_product").eq("id", gigId).maybeSingle();
  if (!gig || gig.creator_id !== user.id) return { error: "Not allowed." };
  if (!gig.needs_product) return { error: "This gig doesn't involve a physical product." };

  const admin = createAdminClient();
  const { error } = await admin.from("gigs").update({ shipping_address: addr, shipping_status: "address_set" }).eq("id", gigId);
  if (error) return { error: error.message };

  await notifyUser(admin, gig.brand_id, {
    type: "gig_update",
    title: "Delivery address ready",
    body: `The creator shared where to send the product for "${gig.title}".`,
    href: `/gigs/${gigId}`,
    ctaLabel: "Arrange delivery",
  });
  revalidatePath(`/gigs/${gigId}`);
  return { ok: true };
}

/** Advance the shipping status: brand marks 'sent', creator marks 'received'. */
export async function setShippingStatusAction(gigId: string, status: "sent" | "received"): Promise<{ error?: string; ok?: boolean }> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in again." };

  const { data: gig } = await supabase.from("gigs").select("id, creator_id, brand_id, title, needs_product").eq("id", gigId).maybeSingle();
  if (!gig || (gig.brand_id !== user.id && gig.creator_id !== user.id)) return { error: "Not allowed." };
  if (!gig.needs_product) return { error: "This gig doesn't involve a physical product." };
  if (status === "sent" && gig.brand_id !== user.id) return { error: "Only the brand marks it sent." };
  if (status === "received" && gig.creator_id !== user.id) return { error: "Only the creator marks it received." };

  const admin = createAdminClient();
  const { error } = await admin.from("gigs").update({ shipping_status: status }).eq("id", gigId);
  if (error) return { error: error.message };

  const other = status === "sent" ? gig.creator_id : gig.brand_id;
  await notifyUser(admin, other, {
    type: "gig_update",
    title: status === "sent" ? "Your product is on the way" : "The creator received the product",
    body: `"${gig.title}" — ${status === "sent" ? "the brand marked the product as sent." : "the creator confirmed delivery."}`,
    href: `/gigs/${gigId}`,
    ctaLabel: "View the gig",
  });
  revalidatePath(`/gigs/${gigId}`);
  return { ok: true };
}
