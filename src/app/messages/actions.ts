"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redactContact } from "@/lib/chat/redact";
import { chatFolder, attachmentKindFromRef, type AttachmentKind } from "@/lib/cloudinary";
import { signedUpload, privateUrlFromRef, privateDownloadUrlFromRef, type SignedUpload } from "@/lib/cloudinary-server";
import { notifyUser } from "@/lib/notify";

type Res = { error?: string };

async function me() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * Find or create the 1:1 conversation between the current user and `otherUserId`.
 * One party must be a brand, the other a creator.
 */
export async function getOrCreateConversation(otherUserId: string): Promise<{ id?: string; error?: string }> {
  const { user } = await me();
  if (!user) return { error: "Please sign in." };
  if (otherUserId === user.id) return { error: "You can't message yourself." };

  const admin = createAdminClient();
  const ids = [user.id, otherUserId];
  const [{ data: brands }, { data: creators }] = await Promise.all([
    admin.from("brand_profiles").select("id").in("id", ids),
    admin.from("creator_profiles").select("id").in("id", ids),
  ]);
  const brandIds = new Set((brands ?? []).map((b) => b.id));
  const creatorIds = new Set((creators ?? []).map((c) => c.id));

  const brandId = ids.find((i) => brandIds.has(i));
  const creatorId = ids.find((i) => creatorIds.has(i) && i !== brandId);
  if (!brandId || !creatorId) return { error: "Conversations are between a brand and a creator." };

  const { data: existing } = await admin
    .from("conversations")
    .select("id")
    .eq("brand_id", brandId)
    .eq("creator_id", creatorId)
    .maybeSingle();
  if (existing) return { id: existing.id };

  const { data, error } = await admin
    .from("conversations")
    .insert({ brand_id: brandId, creator_id: creatorId })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "Could not start the conversation." };
  return { id: data.id };
}

export async function sendMessage(input: {
  conversationId: string;
  body: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentKind?: AttachmentKind | null;
}): Promise<Res & { redacted?: boolean; message?: ChatMessage }> {
  const { user } = await me();
  if (!user) return { error: "Please sign in." };
  const body = (input.body ?? "").trim();
  if (!body && !input.attachmentUrl) return { error: "Write a message." };

  const admin = createAdminClient();
  const { data: conv } = await admin
    .from("conversations")
    .select("id, brand_id, creator_id")
    .eq("id", input.conversationId)
    .maybeSingle();
  if (!conv) return { error: "Conversation not found." };
  if (conv.brand_id !== user.id && conv.creator_id !== user.id) return { error: "Not your conversation." };

  // Contact-detail blocking until a funded contract exists between the two.
  const { data: contract } = await admin
    .from("gigs")
    .select("id")
    .eq("brand_id", conv.brand_id)
    .eq("creator_id", conv.creator_id)
    .in("status", ["funded", "in_progress", "in_review", "revision", "approved", "released", "completed"])
    .limit(1)
    .maybeSingle();

  let text = body;
  let flagged = false;
  if (!contract && body) {
    const r = redactContact(body);
    text = r.text;
    flagged = r.redacted;
  }

  const { data: msg, error } = await admin
    .from("messages")
    .insert({
      conversation_id: conv.id,
      sender_id: user.id,
      body: text,
      attachment_url: input.attachmentUrl ?? null,
      attachment_name: input.attachmentName ?? null,
      attachment_kind: input.attachmentKind ?? null,
      flagged,
    })
    .select("id, sender_id, body, attachment_url, attachment_name, attachment_kind, flagged, created_at")
    .single();
  if (error) return { error: error.message };

  await admin.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conv.id);

  const recipient = conv.brand_id === user.id ? conv.creator_id : conv.brand_id;
  await notifyUser(admin, recipient, {
    type: "message",
    title: "New message",
    body: text.slice(0, 120) || "Sent an attachment",
    href: `/messages/${conv.id}`,
    ctaLabel: "Open the chat",
  });

  revalidatePath(`/messages/${conv.id}`);
  revalidatePath("/messages");
  return { redacted: flagged, message: msg };
}

export type ChatMessage = {
  id: string;
  sender_id: string;
  body: string;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_kind: AttachmentKind | null;
  flagged: boolean;
  created_at: string;
};

export type ResolvedAttachment = { url: string; downloadUrl: string; kind: AttachmentKind };

/**
 * Participant-gated batch resolve: turn stored attachment refs into signed
 * inline + download URLs (and their kind) for a whole thread in one round-trip.
 */
export async function resolveChatAttachments(
  conversationId: string,
  items: { ref: string; name: string | null; kind: AttachmentKind | null }[],
): Promise<{ map?: Record<string, ResolvedAttachment>; error?: string }> {
  const { user } = await me();
  if (!user) return { error: "Please sign in." };
  const admin = createAdminClient();
  const { data: conv } = await admin
    .from("conversations")
    .select("brand_id, creator_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conv || (conv.brand_id !== user.id && conv.creator_id !== user.id)) return { error: "Not allowed." };

  const map: Record<string, ResolvedAttachment> = {};
  for (const it of items) {
    const ref = it.ref;
    if (!ref || map[ref]) continue;
    const kind = it.kind ?? attachmentKindFromRef(ref, it.name);

    if (ref.startsWith("cld:")) {
      // Folder must belong to this conversation (defense in depth).
      if (!ref.includes(`ugcorigin/chat/${conversationId}`)) continue;
      const url = privateUrlFromRef(ref);
      const downloadUrl = privateDownloadUrlFromRef(ref) ?? url ?? "";
      if (url) map[ref] = { url, downloadUrl, kind };
      continue;
    }

    // Legacy Supabase private-bucket path "<convId>/<file>".
    if (ref.split("/")[0] !== conversationId) continue;
    const { data } = await admin.storage.from("chat").createSignedUrl(ref, 600);
    if (data?.signedUrl) map[ref] = { url: data.signedUrl, downloadUrl: data.signedUrl, kind };
  }
  return { map };
}

/** Participant-gated: sign a Cloudinary upload for a chat attachment. */
export async function signChatUpload(
  conversationId: string,
): Promise<{ upload?: SignedUpload; error?: string }> {
  const { user } = await me();
  if (!user) return { error: "Please sign in." };
  const admin = createAdminClient();
  const { data: conv } = await admin
    .from("conversations")
    .select("brand_id, creator_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conv || (conv.brand_id !== user.id && conv.creator_id !== user.id)) return { error: "Not allowed." };
  const upload = signedUpload(chatFolder(conversationId));
  if (!upload) return { error: "Attachments aren’t configured yet." };
  return { upload };
}

/**
 * Open a chat attachment for the current participant. New attachments are
 * Cloudinary authenticated assets (a "cld:" ref) delivered via a signed URL;
 * legacy attachments are paths in the private Supabase "chat" bucket.
 */
export async function signAttachment(ref: string): Promise<{ url?: string; error?: string }> {
  const { user } = await me();
  if (!user) return { error: "Please sign in." };

  // Cloudinary ref: folder is ugcorigin/chat/<convId>/... — authorize on convId.
  if (ref.startsWith("cld:")) {
    const marker = "ugcorigin/chat/";
    const i = ref.indexOf(marker);
    const convId = i >= 0 ? ref.slice(i + marker.length).split("/")[0] : "";
    const admin = createAdminClient();
    const { data: conv } = await admin.from("conversations").select("brand_id, creator_id").eq("id", convId).maybeSingle();
    if (!conv || (conv.brand_id !== user.id && conv.creator_id !== user.id)) return { error: "Not allowed." };
    const url = privateUrlFromRef(ref);
    if (!url) return { error: "Could not open attachment." };
    return { url };
  }

  // Legacy Supabase private-bucket path: "<convId>/<file>".
  const convId = ref.split("/")[0];
  const admin = createAdminClient();
  const { data: conv } = await admin.from("conversations").select("brand_id, creator_id").eq("id", convId).maybeSingle();
  if (!conv || (conv.brand_id !== user.id && conv.creator_id !== user.id)) return { error: "Not allowed." };
  const { data, error } = await admin.storage.from("chat").createSignedUrl(ref, 300);
  if (error || !data) return { error: error?.message ?? "Could not open attachment." };
  return { url: data.signedUrl };
}
