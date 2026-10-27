import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { CLOUD_NAME, CLOUD_API_KEY, decodeCloudRef } from "./cloudinary";

// Server-only Cloudinary signing. The API secret never leaves this module.
// Private files (chat attachments, gig deliverables) upload as authenticated
// assets and are delivered only through signed URLs minted here for an already
// authorized participant. Heavy media lives on Cloudinary; only avatars and
// brand logos stay on Supabase Storage.

const SECRET = process.env.CLOUDINARY_API_SECRET;

let ready = false;
function ensure(): boolean {
  if (!CLOUD_NAME || !CLOUD_API_KEY || !SECRET) return false;
  if (!ready) {
    cloudinary.config({ cloud_name: CLOUD_NAME, api_key: CLOUD_API_KEY, api_secret: SECRET, secure: true });
    ready = true;
  }
  return true;
}

export function cloudinaryServerReady(): boolean {
  return ensure();
}

export type SignedUpload = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
};

/**
 * Sign params for a direct browser upload into `folder` as an authenticated
 * asset. The browser POSTs the file plus these fields to Cloudinary's
 * /auto/upload endpoint; the secret stays here.
 */
export function signedUpload(folder: string): SignedUpload | null {
  if (!ensure()) return null;
  const timestamp = Math.round(Date.now() / 1000);
  // Only these params are signed; resource_type lives in the endpoint URL.
  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp, type: "authenticated" },
    SECRET!,
  );
  return { cloudName: CLOUD_NAME!, apiKey: CLOUD_API_KEY!, timestamp, signature, folder };
}

/** A signed delivery URL for an authenticated asset. Empty if not configured. */
export function privateUrl(publicId: string, resourceType: "image" | "video" | "raw", format?: string): string {
  if (!ensure()) return "";
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: "authenticated",
    sign_url: true,
    secure: true,
    ...(format ? { format } : {}),
  });
}

/** A square, face-cropped JPEG of a private verification photo. Signed, short-lived. */
export function faceDeliveryUrl(publicId: string): string {
  if (!ensure()) return "";
  return cloudinary.url(publicId, {
    resource_type: "image",
    type: "authenticated",
    sign_url: true,
    secure: true,
    transformation: [{ width: 800, height: 800, crop: "fill", gravity: "auto", quality: "auto", fetch_format: "jpg" }],
  });
}

/** Resolve a stored reference (Cloudinary ref or null) to a signed URL. */
export function privateUrlFromRef(ref: string | null | undefined): string | null {
  if (!ref) return null;
  const r = decodeCloudRef(ref);
  if (!r) return null; // legacy (non-Cloudinary) reference, caller falls back
  return privateUrl(r.publicId, r.resourceType, r.format || undefined);
}

/**
 * A signed URL with a repeating "UGCOrigin preview" watermark burned in. Used
 * for deliverable previews shown to the brand BEFORE they approve and release
 * payment — the clean, un-watermarked file unlocks only on approval. Only
 * images/videos are watermarked; other types fall back to the plain URL.
 */
export function watermarkedUrlFromRef(ref: string | null | undefined): string | null {
  if (!ref) return null;
  const r = decodeCloudRef(ref);
  if (!r) return null;
  if (!ensure()) return "";
  if (r.resourceType !== "video" && r.resourceType !== "image") {
    return privateUrl(r.publicId, r.resourceType, r.format || undefined);
  }
  return cloudinary.url(r.publicId, {
    resource_type: r.resourceType,
    type: "authenticated",
    sign_url: true,
    secure: true,
    ...(r.format ? { format: r.format } : {}),
    transformation: [
      r.resourceType === "video" ? { width: 1080, crop: "limit", quality: "auto" } : { width: 1200, crop: "limit", quality: "auto" },
      { overlay: { font_family: "Arial", font_size: 48, font_weight: "bold", text: "UGCOrigin preview" }, color: "#ffffff", opacity: 35 },
      { flags: "layer_apply", gravity: "south_east", x: 24, y: 24 },
    ],
  });
}

/** A signed URL that forces a download (Content-Disposition: attachment). */
export function privateDownloadUrl(publicId: string, resourceType: "image" | "video" | "raw", format?: string): string {
  if (!ensure()) return "";
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: "authenticated",
    sign_url: true,
    secure: true,
    flags: "attachment",
    ...(format ? { format } : {}),
  });
}

export function privateDownloadUrlFromRef(ref: string | null | undefined): string | null {
  if (!ref) return null;
  const r = decodeCloudRef(ref);
  if (!r) return null;
  return privateDownloadUrl(r.publicId, r.resourceType, r.format || undefined);
}

/** Permanently delete an authenticated asset by its stored ref. */
export async function destroyAsset(ref: string): Promise<boolean> {
  if (!ensure()) return false;
  const r = decodeCloudRef(ref);
  if (!r) return false;
  try {
    const res = await cloudinary.uploader.destroy(r.publicId, {
      resource_type: r.resourceType,
      type: "authenticated",
      invalidate: true,
    });
    return res.result === "ok" || res.result === "not found";
  } catch {
    return false;
  }
}
