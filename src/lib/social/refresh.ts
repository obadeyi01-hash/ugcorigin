import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchFollowerCount } from "@/lib/social/followers";

const FRESH_MS = 24 * 60 * 60 * 1000;

/** Refresh cached follower counts when a profile is opened and the cache is a day old. */
export async function refreshSocialFollowers(creatorId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("social_accounts")
    .select("id, platform, handle, url, followers_checked_at")
    .eq("creator_id", creatorId);
  const stale = (data ?? []).filter((row) => {
    if (!row.followers_checked_at) return true;
    return Date.now() - new Date(row.followers_checked_at).getTime() > FRESH_MS;
  });
  await Promise.all(stale.map(async (row) => {
    const count = await fetchFollowerCount(row.platform, row.handle, row.url);
    const patch: { followers_checked_at: string; follower_count?: number } = {
      followers_checked_at: new Date().toISOString(),
    };
    if (count != null) patch.follower_count = count;
    await admin.from("social_accounts").update(patch).eq("id", row.id);
  }));
}
