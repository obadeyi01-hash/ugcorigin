"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyUser } from "@/lib/notify";

type Res = { ok?: boolean; error?: string };

async function auth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function validLink(url: string): boolean {
  if (!url) return true; // optional
  return /^https?:\/\//i.test(url) && url.length < 500;
}

/** Propose a meeting / focus group on a gig. */
export async function proposeMeeting(input: {
  gigId: string;
  kind: "call" | "focus_group";
  title: string;
  scheduledAt: string; // ISO
  link: string;
  notes: string;
}): Promise<Res> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in again." };

  const { data: gig } = await supabase.from("gigs").select("id, brand_id, creator_id, title").eq("id", input.gigId).maybeSingle();
  if (!gig || (gig.brand_id !== user.id && gig.creator_id !== user.id)) return { error: "Not allowed." };

  const title = input.title.trim();
  if (title.length < 3) return { error: "Add a short title." };
  const when = new Date(input.scheduledAt);
  if (isNaN(when.getTime()) || when.getTime() < Date.now() - 60_000) return { error: "Pick a future date and time." };
  if (!validLink(input.link.trim())) return { error: "The meeting link must start with http(s)://" };

  const admin = createAdminClient();
  const { error } = await admin.from("meetings").insert({
    gig_id: gig.id,
    proposed_by: user.id,
    kind: input.kind,
    title,
    scheduled_at: when.toISOString(),
    link: input.link.trim() || null,
    notes: input.notes.trim() || null,
    status: "proposed",
  });
  if (error) return { error: error.message };

  const other = gig.brand_id === user.id ? gig.creator_id : gig.brand_id;
  await notifyUser(admin, other, {
    type: "gig_update",
    title: input.kind === "focus_group" ? "Focus group proposed" : "Meeting proposed",
    body: `"${title}" on ${when.toLocaleString()} for "${gig.title}". Confirm or suggest another time.`,
    href: `/gigs/${gig.id}`,
    ctaLabel: "Review the time",
  });

  revalidatePath(`/gigs/${gig.id}`);
  return { ok: true };
}

/** Confirm, decline or cancel a proposed meeting. */
export async function respondToMeeting(meetingId: string, status: "confirmed" | "declined" | "cancelled"): Promise<Res> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in again." };

  const admin = createAdminClient();
  const { data: m } = await admin.from("meetings").select("id, gig_id, proposed_by, title, scheduled_at").eq("id", meetingId).maybeSingle();
  if (!m) return { error: "Meeting not found." };
  const { data: gig } = await admin.from("gigs").select("brand_id, creator_id, title").eq("id", m.gig_id).maybeSingle();
  if (!gig || (gig.brand_id !== user.id && gig.creator_id !== user.id)) return { error: "Not allowed." };

  // The proposer can cancel; the other party confirms/declines.
  if (status === "cancelled" && m.proposed_by !== user.id) return { error: "Only the proposer can cancel." };
  if ((status === "confirmed" || status === "declined") && m.proposed_by === user.id)
    return { error: "Wait for the other party to confirm." };

  const { error } = await admin.from("meetings").update({ status }).eq("id", meetingId);
  if (error) return { error: error.message };

  const notifyTarget = m.proposed_by === user.id ? (gig.brand_id === user.id ? gig.creator_id : gig.brand_id) : m.proposed_by;
  await notifyUser(admin, notifyTarget, {
    type: "gig_update",
    title: `Meeting ${status}`,
    body: `"${m.title}" was ${status}.`,
    href: `/gigs/${m.gig_id}`,
    ctaLabel: "View the gig",
  });

  revalidatePath(`/gigs/${m.gig_id}`);
  return { ok: true };
}
