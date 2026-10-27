import "server-only";
import { decodeCloudRef } from "@/lib/cloudinary";
import { faceDeliveryUrl } from "@/lib/cloudinary-server";
import { createAdminClient } from "@/lib/supabase/admin";

const FACE = "face.jpg";

function isGeneratedFace(url: string | null, userId: string) {
  if (!url) return false;
  try {
    return new URL(url).pathname.includes(`/avatars/${userId}/${FACE}`);
  } catch {
    return false;
  }
}

/**
 * Copy the private verification face photo into the public avatars bucket and
 * point the profile at it. A photo the creator uploaded themselves is left
 * alone. The private Cloudinary original stays available to reviewers.
 */
export async function publishFacePhoto(userId: string, selfieRef: string | null | undefined): Promise<boolean> {
  const ref = selfieRef ? decodeCloudRef(selfieRef) : null;
  if (!ref || ref.resourceType !== "image") return false;
  const signed = faceDeliveryUrl(ref.publicId);
  if (!signed) return false;

  const res = await fetch(signed);
  if (!res.ok) return false;
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length < 500) return false;

  const admin = createAdminClient();
  const path = `${userId}/${FACE}`;
  const { error: upErr } = await admin.storage.from("avatars").upload(path, bytes, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (upErr) return false;

  const { data: profile } = await admin
    .from("creator_profiles")
    .select("avatar_url, completeness, handle")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return false;

  const current = (profile.avatar_url as string | null) ?? null;
  if (current && !isGeneratedFace(current, userId)) return true;

  const { data: pub } = admin.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = `${pub.publicUrl}?v=${Date.now()}`;
  const { error } = await admin
    .from("creator_profiles")
    .update({
      avatar_url: avatarUrl,
      ...(current ? {} : { completeness: Math.min(100, (profile.completeness ?? 0) + 10) }),
    })
    .eq("id", userId);
  if (error) return false;
  return true;
}
