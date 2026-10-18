export type EmbedPlatform = "youtube" | "tiktok" | "instagram" | "x";

/** Detect a supported embed platform from a post URL. */
export function detectPlatform(url: string): EmbedPlatform | null {
  const u = url.toLowerCase();
  if (/youtube\.com|youtu\.be/.test(u)) return "youtube";
  if (/tiktok\.com/.test(u)) return "tiktok";
  if (/instagram\.com/.test(u)) return "instagram";
  if (/(^|\/\/|\.)x\.com|twitter\.com/.test(u)) return "x";
  return null;
}

/** Extract the YouTube video id from common URL shapes. */
export function youtubeId(url: string): string | null {
  const m =
    url.match(/[?&]v=([a-zA-Z0-9_-]{11})/) ||
    url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/) ||
    url.match(/\/(?:embed|shorts|live)\/([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

/** Extract the TikTok video id. */
export function tiktokId(url: string): string | null {
  const m = url.match(/\/video\/(\d+)/);
  return m ? m[1] : null;
}
