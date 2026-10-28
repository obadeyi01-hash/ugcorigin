export const SOCIAL_ACCOUNT_PLATFORMS = ["instagram", "tiktok", "youtube", "facebook", "x", "twitch"] as const;
export type SocialAccountPlatform = (typeof SOCIAL_ACCOUNT_PLATFORMS)[number];

const LABELS: Record<SocialAccountPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  facebook: "Facebook",
  x: "X",
  twitch: "Twitch",
};

export function socialPlatformLabel(platform: string) {
  return LABELS[platform as SocialAccountPlatform] ?? platform;
}

export function formatFollowers(count: number) {
  const n = Math.round(count);
  if (n >= 1_000_000) {
    const value = n / 1_000_000;
    return `${value >= 10 ? Math.round(value) : value.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const value = n / 1_000;
    return `${value >= 100 ? Math.round(value) : value.toFixed(1)}K`;
  }
  return n.toLocaleString("en-NG");
}

export function isSocialPlatform(value: string): value is SocialAccountPlatform {
  return (SOCIAL_ACCOUNT_PLATFORMS as readonly string[]).includes(value);
}

/** Turn a pasted profile address or @handle into the stored handle and canonical URL. */
export function parseSocialAccount(platform: SocialAccountPlatform, raw: string): { handle: string; url: string } | null {
  const text = raw.trim();
  if (!text) return null;
  if (/facebook\.com\/share\//i.test(text) || /facebook\.com\/share\.php/i.test(text)) return null;

  let handle = text.replace(/^@/, "");
  try {
    const withScheme = /^https?:\/\//i.test(text) ? text : text.includes(".") ? `https://${text}` : "";
    if (withScheme) {
      const url = new URL(withScheme);
      const parts = url.pathname.split("/").filter(Boolean);
      if (platform === "youtube") {
        const at = parts.find((part) => part.startsWith("@"));
        const channel = parts[0] === "channel" ? parts[1] : null;
        handle = (at ?? channel ?? parts[0] ?? "").replace(/^@/, "");
      } else if (platform === "tiktok") {
        handle = (parts.find((part) => part.startsWith("@")) ?? parts[0] ?? "").replace(/^@/, "");
      } else if (platform === "facebook") {
        handle = parts[0] === "profile.php" ? (url.searchParams.get("id") ?? "") : (parts[0] ?? "");
      } else {
        handle = (parts[0] ?? "").replace(/^@/, "");
      }
    }
  } catch {
    return null;
  }

  handle = handle.replace(/[/?#].*$/, "").trim();
  if (!/^[A-Za-z0-9._-]{2,80}$/.test(handle)) return null;

  const url = canonicalUrl(platform, handle);
  return url ? { handle, url } : null;
}

function canonicalUrl(platform: SocialAccountPlatform, handle: string) {
  if (platform === "instagram") return `https://instagram.com/${handle}`;
  if (platform === "tiktok") return `https://www.tiktok.com/@${handle}`;
  if (platform === "youtube") return handle.startsWith("UC") ? `https://www.youtube.com/channel/${handle}` : `https://www.youtube.com/@${handle}`;
  if (platform === "facebook") return `https://www.facebook.com/${handle}`;
  if (platform === "x") return `https://x.com/${handle}`;
  if (platform === "twitch") return `https://www.twitch.tv/${handle}`;
  return null;
}

export function socialHostPath(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname.replace(/^www\./, "")}${parsed.pathname}`.replace(/\/$/, "");
  } catch {
    return url;
  }
}
