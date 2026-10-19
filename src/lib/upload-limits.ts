// One place for every upload rule in the app, plus friendly validators that
// return plain-English errors (shown inline / as popups) so a creator always
// knows WHY an upload was rejected. Videos are also checked for duration.
//
// Storage strategy: images (avatars, brand logos) live on Supabase and are
// downscaled to WebP before upload; videos live on Cloudinary and are delivered
// web-optimized (f_auto,q_auto) and resolution-capped. These caps keep both the
// stored originals and the delivered bandwidth under control.

const MB = 1024 * 1024;

export type UploadKind = "avatar" | "logo" | "chat" | "showcase" | "deliverable";

export type UploadLimit = {
  label: string;
  /** Max bytes of the file the user selects (before our own optimization). */
  maxBytes: number;
  /** Allowed MIME types. For video we also accept any `video/*` as a fallback. */
  types: string[];
  /** Human hint of accepted formats, e.g. "MP4, MOV or WebM". */
  typeHint: string;
  /** Max duration in seconds (video only). */
  maxSeconds?: number;
  /** Shown as guidance near the control / in tooltips. */
  guide: string;
};

export const LIMITS: Record<UploadKind, UploadLimit> = {
  avatar: {
    label: "Profile photo",
    maxBytes: 10 * MB,
    types: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
    typeHint: "JPG, PNG or WebP",
    guide: "A clear, well-lit photo of your face. Square works best — we optimize it automatically.",
  },
  logo: {
    label: "Brand logo",
    maxBytes: 10 * MB,
    types: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
    typeHint: "JPG, PNG, SVG or WebP",
    guide: "Your logo on a clean background. We optimize it automatically.",
  },
  chat: {
    label: "Attachment",
    maxBytes: 10 * MB,
    types: ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"],
    typeHint: "an image or PDF",
    guide: "Images or a PDF, up to 10MB.",
  },
  showcase: {
    label: "Showcase video",
    maxBytes: 100 * MB,
    types: ["video/mp4", "video/quicktime", "video/webm"],
    typeHint: "MP4, MOV or WebM",
    maxSeconds: 60,
    guide: "Vertical 9:16, 1080p, 15–60 seconds, under 100MB. We convert it to a lighter web format for fast playback.",
  },
  deliverable: {
    label: "Deliverable",
    maxBytes: 200 * MB,
    types: ["video/mp4", "video/quicktime", "video/webm"],
    typeHint: "MP4, MOV or WebM",
    maxSeconds: 300,
    guide: "The brand's draft: up to 5 minutes, 1080p, under 200MB. We optimize delivery automatically.",
  },
};

export type ValidationError = { ok: false; error: string };
export type ValidationOk = { ok: true };
export type Validation = ValidationOk | ValidationError;

function mb(n: number) {
  return `${Math.round(n / MB)}MB`;
}

function prettySeconds(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return m ? `${m}m${r.toString().padStart(2, "0")}s` : `${r}s`;
}

/** Synchronous type + size checks, shared by images and videos. */
export function validateFile(file: File, kind: UploadKind): Validation {
  const L = LIMITS[kind];
  const isVideo = kind === "showcase" || kind === "deliverable";

  const typeOk = L.types.includes(file.type) || (isVideo && file.type.startsWith("video/"));
  if (file.type && !typeOk) {
    return { ok: false, error: `That file isn't supported. ${L.label} must be ${L.typeHint}.` };
  }
  if (file.size > L.maxBytes) {
    return {
      ok: false,
      error: `That file is ${mb(file.size)}. ${L.label}s must be under ${mb(L.maxBytes)}${
        isVideo ? " — try trimming it or exporting at 1080p." : "."
      }`,
    };
  }
  return { ok: true };
}

/** Read a video's duration (seconds) in the browser without uploading it. */
export function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(v.duration || 0);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("metadata"));
    };
    v.src = url;
  });
}

/** Full async validation for a video: type, size, then duration. */
export async function validateVideo(file: File, kind: "showcase" | "deliverable"): Promise<Validation> {
  const base = validateFile(file, kind);
  if (!base.ok) return base;
  const L = LIMITS[kind];
  if (!L.maxSeconds) return { ok: true };
  let seconds: number;
  try {
    seconds = await readVideoDuration(file);
  } catch {
    // Can't read duration (rare/odd codec) — let it through; Cloudinary re-encodes.
    return { ok: true };
  }
  if (seconds > L.maxSeconds + 0.5) {
    return {
      ok: false,
      error: `That clip is ${prettySeconds(seconds)}. ${L.label}s must be ${prettySeconds(L.maxSeconds)} or less.`,
    };
  }
  return { ok: true };
}
