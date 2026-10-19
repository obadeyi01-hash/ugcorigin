// Cloudinary media (profile videos + heavy portfolio media). Images stay on
// Supabase Storage + next/image (auto WebP/AVIF); Cloudinary handles VIDEO,
// which needs transcoding + adaptive delivery. Signed uploads keep the secret
// server-side. Delivery always uses f_auto,q_auto so the browser gets the
// best-fit optimized format (WebP/AVIF images, efficient video codecs).
//
// Folder convention (keep identical discipline everywhere):
//   ugcorigin/creators/<creatorId>/videos      profile showcase videos
//   ugcorigin/creators/<creatorId>/portfolio   portfolio media
//   ugcorigin/brands/<brandId>/media            brand assets (later)
// (Supabase buckets mirror this: avatars/<uid>/, deliverables/<gigId>/,
//  chat/<conversationId>/.)

export const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
export const CLOUD_API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

export const cloudinaryConfigured = () => !!CLOUD_NAME;

export function creatorVideoFolder(creatorId: string) {
  return `ugcorigin/creators/${creatorId}/videos`;
}
export function creatorPortfolioFolder(creatorId: string) {
  return `ugcorigin/creators/${creatorId}/portfolio`;
}

/** Optimized delivery URL. resourceType: "video" | "image". */
export function cloudinaryUrl(
  publicId: string,
  resourceType: "video" | "image" = "video",
  extra = "",
): string {
  if (!CLOUD_NAME) return "";
  const t = ["f_auto", "q_auto", extra].filter(Boolean).join(",");
  return `https://res.cloudinary.com/${CLOUD_NAME}/${resourceType}/upload/${t}/${publicId}`;
}

/** A still poster frame (first frame) for a video, as an optimized image. */
export function videoPoster(publicId: string): string {
  if (!CLOUD_NAME) return "";
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/so_0,f_auto,q_auto/${publicId}.jpg`;
}
