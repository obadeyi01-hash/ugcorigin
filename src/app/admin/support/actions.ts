"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { guardWrite } from "@/lib/admin/rbac";
import { notifyUser } from "@/lib/notify";

type Res = { ok?: boolean; error?: string };

/** Reply to a ticket and mark it resolved; notifies the user by email. */
export async function respondToTicket(ticketId: string, response: string, status: "resolved" | "in_progress" | "closed"): Promise<Res> {
  const { ctx, error } = await guardWrite("support");
  if (error || !ctx) return { error: error ?? "Not permitted." };
  const reply = response.trim();
  if (reply.length < 2) return { error: "Write a reply first." };

  const admin = createAdminClient();
  const { data: ticket } = await admin.from("support_tickets").select("id, user_id, subject").eq("id", ticketId).maybeSingle();
  if (!ticket) return { error: "Ticket not found." };

  const { error: e } = await admin
    .from("support_tickets")
    .update({ response: reply, status, responded_by: ctx.userId, responded_at: new Date().toISOString() })
    .eq("id", ticketId);
  if (e) return { error: e.message };

  await notifyUser(admin, ticket.user_id, {
    type: "support",
    title: "Support replied to your ticket",
    body: `Re: "${ticket.subject}": ${reply.slice(0, 160)}`,
    href: "/support",
    ctaLabel: "View the reply",
  });

  revalidatePath("/admin/support");
  return { ok: true };
}

/** Change a ticket's status without a reply. */
export async function setTicketStatus(ticketId: string, status: "open" | "in_progress" | "resolved" | "closed"): Promise<Res> {
  const { ctx, error } = await guardWrite("support");
  if (error || !ctx) return { error: error ?? "Not permitted." };
  const admin = createAdminClient();
  const { error: e } = await admin.from("support_tickets").update({ status }).eq("id", ticketId);
  if (e) return { error: e.message };
  revalidatePath("/admin/support");
  return { ok: true };
}
