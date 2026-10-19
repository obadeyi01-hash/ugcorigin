// Client-side image downscale + WebP conversion, run before upload. Avatars and
// brand logos are the only images we keep on Supabase, so shrinking them here
// keeps storage tiny and loads fast: a phone photo (1–3 MB) becomes a ~512px
// WebP of ~20–45 KB. Falls back to the original file if the browser can't
// produce a WebP (very old browsers) so uploads never break.

export type ResizeOpts = {
  /** Longest edge (square side for avatars) in px. */
  maxSize?: number;
  /** Cover-crop to a maxSize×maxSize square (avatars). */
  square?: boolean;
  /** 0..1 WebP quality. */
  quality?: number;
};

export async function resizeToWebp(file: File, opts: ResizeOpts = {}): Promise<File> {
  const { maxSize = 512, square = false, quality = 0.82 } = opts;
  if (!file.type.startsWith("image/")) return file;
  // GIFs can be animated; converting would drop the animation, so leave as-is.
  if (file.type === "image/gif") return file;

  let bitmap: ImageBitmap | HTMLImageElement;
  try {
    bitmap = await loadBitmap(file);
  } catch {
    return file;
  }

  const sw = "width" in bitmap ? bitmap.width : 0;
  const sh = "height" in bitmap ? bitmap.height : 0;
  if (!sw || !sh) return file;

  let dw: number, dh: number, sx = 0, sy = 0, cropW = sw, cropH = sh;
  if (square) {
    const side = Math.min(sw, sh);
    sx = Math.round((sw - side) / 2);
    sy = Math.round((sh - side) / 2);
    cropW = side;
    cropH = side;
    dw = dh = Math.min(maxSize, side);
  } else {
    const scale = Math.min(1, maxSize / Math.max(sw, sh));
    dw = Math.round(sw * scale);
    dh = Math.round(sh * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap as CanvasImageSource, sx, sy, cropW, cropH, 0, 0, dw, dh);
  if ("close" in bitmap) bitmap.close();

  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", quality));
  if (!blob || blob.type !== "image/webp") return file; // WebP unsupported → original
  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${base}.webp`, { type: "image/webp" });
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through to <img> */
    }
  }
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode failed"));
    };
    img.src = url;
  });
}
