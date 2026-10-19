import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

// Pluggable AI-media detector. Point AI_DETECT_URL at a provider that accepts
// { url } and returns { score: 0..100 } (higher = more likely AI-generated).
// With nothing configured, detection is skipped and media is queued unscored
// for manual review. Env:
//   AI_DETECT_URL   provider endpoint
//   AI_DETECT_KEY   bearer token (optional)
const FLAG_THRESHOLD = 70;

export const aiDetectConfigured = () => !!process.env.AI_DETECT_URL;

/** Score one media URL for AI-generation likelihood (0..100), or null. */
export async function scoreMedia(url: string): Promise<number | null> {
  const endpoint = process.env.AI_DETECT_URL;
  if (!endpoint) return null;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.AI_DETECT_KEY ? { Authorization: `Bearer ${process.env.AI_DETECT_KEY}` } : {}),
      },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { score?: number };
    if (typeof json.score !== "number") return null;
    return Math.max(0, Math.min(100, Math.round(json.score)));
  } catch {
    return null;
  }
}

/**
 * Queue a piece of media for AI review, scoring it first if a provider is set.
 * High scores are flagged (and the creator's profile marked for media review);
 * everything else is queued unscored/cleared. Best-effort, never throws.
 */
export async function queueMediaReview(admin: Admin, creatorId: string, url: string, kind: "video" | "image" | "avatar"): Promise<void> {
  try {
    const score = await scoreMedia(url);
    const flagged = score != null && score >= FLAG_THRESHOLD;
    await admin.from("media_reviews").insert({
      creator_id: creatorId,
      media_url: url,
      kind,
      ai_score: score,
      status: flagged ? "flagged" : score == null ? "pending" : "cleared",
    });
    if (flagged) {
      await admin.from("creator_profiles").update({ media_flagged: true }).eq("id", creatorId);
    }
  } catch {
    /* best-effort */
  }
}
