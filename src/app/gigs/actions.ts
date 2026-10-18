"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paystackConfigured, initiateTransfer } from "@/lib/payments/paystack";

async function auth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

/** Creator-only: get a signed URL to upload a deliverable directly to storage. */
export async function getUploadUrlAction(
  gigId: string,
  filename: string,
): Promise<{ path?: string; token?: string; error?: string }> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in again." };

  const { data: gig } = await supabase.from("gigs").select("id, creator_id, status").eq("id", gigId).maybeSingle();
  if (!gig || gig.creator_id !== user.id) return { error: "Not allowed." };

  const path = `${gigId}/${crypto.randomUUID()}-${safeName(filename)}`;
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("deliverables").createSignedUploadUrl(path);
  if (error) return { error: error.message };
  return { path: data.path, token: data.token };
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
  await admin.from("notifications").insert({
    user_id: gig.brand_id,
    type: "draft_submitted",
    title: "A draft is ready to review",
    body: `"${gig.title}" has a new draft for your feedback.`,
    href: `/gigs/${gigId}`,
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
  await admin.from("notifications").insert({
    user_id: gig.creator_id,
    type: "revision_requested",
    title: "Revision requested",
    body: `The brand asked for changes on "${gig.title}".`,
    href: `/gigs/${gigId}`,
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

  await admin.from("notifications").insert([
    { user_id: gig.creator_id, type: "approved", title: "Your work was approved", body: `"${gig.title}" was approved, your payout is on the way.`, href: `/gigs/${gigId}` },
    { user_id: gig.brand_id, type: "approved", title: "Content approved", body: `You approved "${gig.title}". Final files are unlocked.`, href: `/gigs/${gigId}` },
  ]);

  revalidatePath(`/gigs/${gigId}`);
  return { ok: true, payoutQueued };
}
