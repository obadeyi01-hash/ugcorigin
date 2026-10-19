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

/** Resolve a stored reference (Cloudinary ref or null) to a signed URL. */
export function privateUrlFromRef(ref: string | null | undefined): string | null {
  if (!ref) return null;
  const r = decodeCloudRef(ref);
  if (!r) return null; // legacy (non-Cloudinary) reference, caller falls back
  return privateUrl(r.publicId, r.resourceType, r.format || undefined);
}
