"use server";

import { createClient } from "@/lib/supabase/server";

export type ReportTarget = "profile" | "review" | "campaign_submission" | "deliverable";

export async function submitReportAction(input: {
  targetType: ReportTarget;
  targetId: string;
  reason: string;
  details?: string;
}): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to report." };
  if (!input.reason) return { error: "Pick a reason." };

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: input.targetType,
    target_id: input.targetId,
    reason: input.reason,
    details: input.details?.trim() || null,
  });
  if (error) return { error: error.message };
  return { ok: true };
}
