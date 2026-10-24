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
export function chatFolder(conversationId: string) {
  return `ugcorigin/chat/${conversationId}`;
}
export function deliverableFolder(gigId: string) {
  return `ugcorigin/deliverables/${gigId}`;
}
export function identityFolder(userId: string) {
  return `ugcorigin/identity/${userId}`;
}

// Private files (chat attachments, deliverables) are stored on Cloudinary as
// `type=authenticated` and delivered only through server-signed URLs. We keep
// everything needed to re-sign the URL in a single text column, so we need no
// schema change and legacy Supabase paths (plain strings) still resolve via the
// old code path. Format is "cld:<resourceType>:<format>:<publicId>".
export type CloudRef = { resourceType: "image" | "video" | "raw"; format: string; publicId: string };

export function encodeCloudRef(r: CloudRef): string {
  return `cld:${r.resourceType}:${r.format}:${r.publicId}`;
}

export type AttachmentKind = "image" | "video" | "audio" | "file";

const AUDIO_EXT = new Set(["webm", "mp3", "m4a", "aac", "ogg", "oga", "wav", "opus"]);
const VIDEO_EXT = new Set(["mp4", "mov", "webm", "m4v", "avi", "mkv"]);
const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif", "heic", "heif"]);

/**
 * Best-effort attachment kind from a stored ref or filename. The DB column
 * `attachment_kind` is the source of truth for new messages; this is the
 * fallback for legacy rows (and disambiguates webm audio vs video by filename).
 */
export function attachmentKindFromRef(ref: string, name?: string | null): AttachmentKind {
  const ext = (name?.split(".").pop() || "").toLowerCase();
  const cr = decodeCloudRef(ref);
  // Cloudinary stores audio under resource_type "video", so trust the extension
  // first when it clearly names an audio/image/video format.
  if (ext) {
    if (AUDIO_EXT.has(ext)) return "audio";
    if (IMAGE_EXT.has(ext)) return "image";
    if (VIDEO_EXT.has(ext)) return "video";
    if (ext === "pdf") return "file";
  }
  if (cr) {
    if (cr.resourceType === "image") return "image";
    if (cr.resourceType === "video") return AUDIO_EXT.has(cr.format) ? "audio" : "video";
    return "file";
  }
  return "file";
}

export function decodeCloudRef(ref: string): CloudRef | null {
  if (!ref.startsWith("cld:")) return null;
  const rest = ref.slice(4);
  const first = rest.indexOf(":");
  const second = rest.indexOf(":", first + 1);
  if (first < 0 || second < 0) return null;
  const resourceType = rest.slice(0, first) as CloudRef["resourceType"];
  const format = rest.slice(first + 1, second);
  const publicId = rest.slice(second + 1);
  if (!publicId) return null;
  return { resourceType, format, publicId };
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
