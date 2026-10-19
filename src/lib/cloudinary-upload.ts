// Client-side direct upload to Cloudinary using server-signed params. Keeps
// large/private media off Supabase. Returns the pieces we persist (as a
// "cld:" ref) so the file can be re-signed for delivery later.

import { encodeCloudRef, type CloudRef } from "./cloudinary";

export type SignedUploadParams = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
};

export type UploadResult = CloudRef & { ref: string; bytes: number };

/**
 * Upload `file` to Cloudinary's auto endpoint (image/video/raw auto-detected)
 * as an authenticated asset. `onProgress` reports 0..100.
 */
export function uploadToCloudinary(
  file: File,
  params: SignedUploadParams,
  onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", params.apiKey);
    form.append("timestamp", String(params.timestamp));
    form.append("signature", params.signature);
    form.append("folder", params.folder);
    form.append("type", "authenticated");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${params.cloudName}/auto/upload`);
    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        try {
          reject(new Error(JSON.parse(xhr.responseText)?.error?.message || "Upload failed."));
        } catch {
          reject(new Error("Upload failed."));
        }
        return;
      }
      const r = JSON.parse(xhr.responseText) as {
        public_id: string;
        resource_type: CloudRef["resourceType"];
        format?: string;
        bytes: number;
      };
      const cloudRef: CloudRef = { resourceType: r.resource_type, format: r.format ?? "", publicId: r.public_id };
      resolve({ ...cloudRef, ref: encodeCloudRef(cloudRef), bytes: r.bytes });
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(form);
  });
}
