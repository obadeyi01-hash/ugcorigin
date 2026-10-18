"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { detectPlatform } from "@/lib/social/detect";

async function auth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function addPortfolioLinkAction(url: string): Promise<{ error?: string; ok?: boolean }> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in again." };

  const clean = url.trim();
  const platform = detectPlatform(clean);
  if (!platform) return { error: "Paste an X, Instagram, TikTok or YouTube post link." };

  const { data: creator } = await supabase.from("creator_profiles").select("id").eq("id", user.id).maybeSingle();
  if (!creator) return { error: "Set up your creator profile first." };

  const { count } = await supabase.from("portfolio_links").select("id", { count: "exact", head: true }).eq("creator_id", user.id);
  if ((count ?? 0) >= 12) return { error: "You can feature up to 12 posts." };

  const { error } = await supabase.from("portfolio_links").insert({
    creator_id: user.id,
    platform,
    url: clean,
    position: count ?? 0,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function removePortfolioLinkAction(id: string): Promise<{ error?: string }> {
  const { supabase, user } = await auth();
  if (!user) return { error: "Please sign in again." };
  const { error } = await supabase.from("portfolio_links").delete().eq("id", id).eq("creator_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return {};
}
