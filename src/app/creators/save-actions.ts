"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Brand saves/unsaves a creator (a "like"). Returns the new saved state.
 * Only brands can save; creators/anon get a gentle error the UI can act on.
 */
export async function toggleSaveCreator(creatorId: string): Promise<{ saved?: boolean; error?: string; needsBrand?: boolean }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { error: "Backend not connected." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to save creators.", needsBrand: true };

  const { data: brand } = await supabase.from("brand_profiles").select("id").eq("id", user.id).maybeSingle();
  if (!brand) return { error: "Only brand accounts can save creators.", needsBrand: true };

  const { data: existing } = await supabase
    .from("saved_creators")
    .select("creator_id")
    .eq("brand_id", user.id)
    .eq("creator_id", creatorId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("saved_creators").delete().eq("brand_id", user.id).eq("creator_id", creatorId);
    if (error) return { error: error.message };
    return { saved: false };
  }
  const { error } = await supabase.from("saved_creators").insert({ brand_id: user.id, creator_id: creatorId });
  if (error) return { error: error.message };
  return { saved: true };
}
