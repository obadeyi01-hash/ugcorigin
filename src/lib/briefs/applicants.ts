import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppRow } from "@/components/briefs/applications-list";

type CreatorEmbed = {
  handle: string | null;
  display_name: string | null;
  location: string | null;
  niches: string[] | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/**
 * Applications on these briefs, with the public facts a brand is meant to see
 * before a contract (name, handle, pitch, sample, location, niches). Conversation
 * and gig links are filled in once one exists. Phone and social handles stay off
 * this card; those open on the profile and the gig once a contract has started.
 */
export async function loadBriefApplications(
  briefIds: string[],
  brandId: string,
  messageBase: "brand" | "admin" = "brand",
): Promise<Map<string, AppRow[]>> {
  const map = new Map<string, AppRow[]>();
  if (briefIds.length === 0) return map;

  const admin = createAdminClient();
  const { data } = await admin
    .from("applications")
    .select("id, brief_id, status, pitch, sample_url, creator_id, creator:creator_profiles(handle, display_name, location, niches)")
    .in("brief_id", briefIds)
    .order("created_at", { ascending: true });

  const rows = data ?? [];
  const creatorIds = [...new Set(rows.map((row) => row.creator_id))];
  const [{ data: convs }, { data: gigs }] = await Promise.all([
    creatorIds.length
      ? admin.from("conversations").select("id, creator_id").eq("brand_id", brandId).in("creator_id", creatorIds)
      : Promise.resolve({ data: [] as { id: string; creator_id: string }[] }),
    admin.from("gigs").select("id, creator_id, brief_id").eq("brand_id", brandId).in("brief_id", briefIds),
  ]);

  const convByCreator = new Map((convs ?? []).map((row) => [row.creator_id, row.id]));
  const gigByPair = new Map(
    (gigs ?? [])
      .filter((row) => row.brief_id)
      .map((row) => [`${row.brief_id}:${row.creator_id}`, row.id]),
  );

  for (const row of rows) {
    const creator = one(row.creator as CreatorEmbed | CreatorEmbed[] | null);
    const conversationId = convByCreator.get(row.creator_id) ?? null;
    const gigId = gigByPair.get(`${row.brief_id}:${row.creator_id}`) ?? null;
    const app: AppRow = {
      id: row.id,
      pitch: row.pitch,
      sample_url: row.sample_url,
      status: row.status,
      creatorHandle: creator?.handle ?? null,
      creatorName: creator?.display_name || (creator?.handle ? `@${creator.handle}` : "Creator"),
      location: creator?.location ?? null,
      niches: creator?.niches ?? [],
      messageHref: conversationId
        ? messageBase === "admin"
          ? `/admin/messages?c=${conversationId}`
          : `/messages/${conversationId}`
        : null,
      gigHref: gigId ? `/gigs/${gigId}` : null,
    };
    const list = map.get(row.brief_id) ?? [];
    list.push(app);
    map.set(row.brief_id, list);
  }
  return map;
}
