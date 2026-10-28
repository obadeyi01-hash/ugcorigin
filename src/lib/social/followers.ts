import { isSocialPlatform } from "@/lib/social/accounts";

/** Read a public follower count. YouTube answers when YOUTUBE_API_KEY is set.
 *  TikTok, Instagram, Facebook and X do not publish this number to a link. */
export async function fetchFollowerCount(platform: string, handle: string, url: string | null): Promise<number | null> {
  if (!isSocialPlatform(platform) || platform !== "youtube") return null;
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;
  const params = new URLSearchParams({ part: "statistics", key });
  if (handle.startsWith("UC") && url?.includes("/channel/")) params.set("id", handle);
  else params.set("forHandle", handle.replace(/^@/, ""));
  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      items?: { statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean } }[];
    };
    const stats = json.items?.[0]?.statistics;
    if (!stats || stats.hiddenSubscriberCount) return null;
    const count = Number(stats.subscriberCount);
    return Number.isFinite(count) && count >= 0 ? Math.round(count) : null;
  } catch {
    return null;
  }
}
