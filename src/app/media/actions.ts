"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CLOUD_NAME, CLOUD_API_KEY, creatorVideoFolder, cloudinaryUrl, videoPoster } from "@/lib/cloudinary";

const MAX_VIDEOS = 6;

async function creator() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, creatorId: null as string | null };
  const { data } = await supabase.from("creator_profiles").select("id").eq("id", user.id).maybeSingle();
  return { supabase, user, creatorId: data?.id ?? null };
}

/** Return a short-lived signature so the browser can upload a video straight to
 *  Cloudinary (the secret never leaves the server). Folder is per-creator. */
export async function signVideoUpload(): Promise<
  { ok: true; cloudName: string; apiKey: string; timestamp: number; signature: string; folder: string } | { ok: false; error: string }
> {
  const { creatorId } = await creator();
  if (!creatorId) return { ok: false, error: "Set up a creator profile first." };
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!CLOUD_NAME || !CLOUD_API_KEY || !secret) return { ok: false, error: "Video uploads aren’t configured yet." };

  const timestamp = Math.round(Date.now() / 1000);
  const folder = creatorVideoFolder(creatorId);
  // Cloudinary signs the alphabetically-sorted params + the api secret.
  const toSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto.createHash("sha1").update(toSign + secret).digest("hex");
  return { ok: true, cloudName: CLOUD_NAME, apiKey: CLOUD_API_KEY, timestamp, signature, folder };
}

/** Record a video the browser just uploaded to Cloudinary. */
export async function saveProfileVideo(publicId: string): Promise<{ ok?: boolean; error?: string }> {
  const { supabase, creatorId } = await creator();
  if (!creatorId) return { error: "Set up a creator profile first." };
  if (!/^[\w/-]{3,200}$/.test(publicId)) return { error: "Invalid upload reference." };

  const { count } = await supabase.from("profile_videos").select("id", { count: "exact", head: true }).eq("creator_id", creatorId);
  if ((count ?? 0) >= MAX_VIDEOS) return { error: `You can show up to ${MAX_VIDEOS} videos.` };

  const { error } = await supabase.from("profile_videos").insert({
    creator_id: creatorId,
    public_id: publicId,
    url: cloudinaryUrl(publicId, "video"),
    poster_url: videoPoster(publicId),
    position: count ?? 0,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  const { data: me } = await supabase.from("creator_profiles").select("handle").eq("id", creatorId).maybeSingle();
  if (me?.handle) revalidatePath(`/${me.handle}`);
  return { ok: true };
}

export async function deleteProfileVideo(id: string): Promise<{ ok?: boolean; error?: string }> {
  const { supabase, creatorId } = await creator();
  if (!creatorId) return { error: "Not allowed." };
  const { error } = await supabase.from("profile_videos").delete().eq("id", id).eq("creator_id", creatorId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}
