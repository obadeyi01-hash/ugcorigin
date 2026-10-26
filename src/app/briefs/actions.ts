"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fundOfferAction } from "@/app/offers/actions";
import { requireLiveCreator, requireVerifiedBrand } from "@/lib/verification/gates";

async function auth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export type BriefInput = {
  title: string;
  description: string;
  niches: string[];
  budget: number;
  deadline: string;
  slots: number;
};

export async function postBriefAction(input: BriefInput): Promise<{ error?: string; needsBrand?: boolean; href?: string }> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in to post a brief." };

  const gate = await requireVerifiedBrand(supabase, user.id);
  if (!gate.ok) return { error: gate.error, needsBrand: gate.needsBrand, href: gate.href };

  if (!input.title.trim()) return { error: "Add a title." };
  if (!(input.budget > 0)) return { error: "Set a budget per creator." };

  const { data, error } = await supabase
    .from("briefs")
    .insert({
      brand_id: user.id,
      title: input.title.trim(),
      description: input.description.trim(),
      niches: input.niches,
      budget_naira: Math.round(input.budget),
      deadline: input.deadline || null,
      slots: Math.min(100, Math.max(1, Math.round(input.slots || 1))),
      gig_type: "original",
      status: "open",
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/briefs");
  redirect(`/briefs/${data.id}`);
}

export async function applyToBriefAction(
  briefId: string,
  pitch: string,
  sampleUrl: string,
): Promise<{ error?: string; ok?: boolean; needsCreator?: boolean; href?: string }> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in to apply." };

  const gate = await requireLiveCreator(supabase, user.id);
  if (!gate.ok) return { error: gate.error, needsCreator: gate.needsCreator, href: gate.href };

  const { data: brief } = await supabase.from("briefs").select("id, status").eq("id", briefId).maybeSingle();
  if (!brief || brief.status !== "open") return { error: "This brief is no longer open." };

  const { error } = await supabase.from("applications").insert({
    brief_id: briefId,
    creator_id: user.id,
    pitch: pitch.trim() || null,
    sample_url: sampleUrl.trim() || null,
    status: "applied",
  });
  if (error) {
    if (error.code === "23505") return { error: "You've already applied to this brief." };
    return { error: error.message };
  }

  revalidatePath(`/briefs/${briefId}`);
  return { ok: true };
}

/** Brand selects an applicant → creates an accepted offer → funds it (reuses escrow flow). */
export async function selectApplicantAction(applicationId: string): Promise<{ url?: string; configured?: boolean; error?: string }> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in again." };

  const { data: app } = await supabase
    .from("applications")
    .select("id, brief_id, creator_id, status")
    .eq("id", applicationId)
    .maybeSingle();
  if (!app) return { error: "Application not found." };

  const { data: brief } = await supabase
    .from("briefs")
    .select("id, brand_id, title, description, budget_naira, deadline, status")
    .eq("id", app.brief_id)
    .maybeSingle();
  if (!brief || brief.brand_id !== user.id) return { error: "Not allowed." };
  const gate = await requireVerifiedBrand(supabase, user.id);
  if (!gate.ok) return { error: gate.error };

  const admin = createAdminClient();

  // Create an accepted offer derived from the brief (the creator opted in by applying).
  const { data: offer, error: offerErr } = await admin
    .from("offers")
    .insert({
      brand_id: user.id,
      creator_id: app.creator_id,
      title: brief.title,
      brief: brief.description,
      price_naira: brief.budget_naira ?? 0,
      deadline: brief.deadline,
      status: "accepted",
    })
    .select("id")
    .single();
  if (offerErr || !offer) return { error: offerErr?.message ?? "Could not create the offer." };

  await admin.from("applications").update({ status: "selected" }).eq("id", applicationId);

  // Fund it via the existing escrow flow.
  return await fundOfferAction(offer.id);
}
