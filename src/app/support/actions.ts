"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyUser } from "@/lib/notify";

export type TicketCategory = "account" | "payment" | "gig" | "trust_safety" | "bug" | "other";

export async function createTicket(input: {
  category: TicketCategory;
  subject: string;
  body: string;
}): Promise<{ ok?: boolean; error?: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { error: "Backend not connected." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to contact support." };

  const subject = input.subject.trim();
  const body = input.body.trim();
  if (subject.length < 4) return { error: "Please add a short subject." };
  if (body.length < 10) return { error: "Please describe the issue in a little more detail." };

  const { error } = await supabase.from("support_tickets").insert({
    user_id: user.id,
    category: input.category,
    subject,
    body,
  });
  if (error) return { error: error.message };

  // Confirm to the user by email + in-app.
  const admin = createAdminClient();
  await notifyUser(admin, user.id, {
    type: "support",
    title: "We got your support request",
    body: `Thanks for reaching out about "${subject}". Our team will get back to you shortly.`,
    href: "/support",
    ctaLabel: "View your tickets",
  });

  revalidatePath("/support");
  return { ok: true };
}
