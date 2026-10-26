import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/components/seo/json-ld";
import { JOURNAL, journalImage } from "@/content/journal";

const STATIC: { path: string; priority: number; freq: "daily" | "weekly" | "monthly" }[] = [
  { path: "", priority: 1, freq: "daily" },
  { path: "/creators", priority: 0.9, freq: "daily" },
  { path: "/for-brands", priority: 0.9, freq: "weekly" },
  { path: "/for-creators", priority: 0.9, freq: "weekly" },
  { path: "/services", priority: 0.7, freq: "weekly" },
  { path: "/briefs", priority: 0.7, freq: "daily" },
  { path: "/campaigns", priority: 0.7, freq: "daily" },
  { path: "/pricing", priority: 0.6, freq: "monthly" },
  { path: "/docs", priority: 0.6, freq: "weekly" },
  { path: "/journal", priority: 0.8, freq: "daily" },
  { path: "/about", priority: 0.4, freq: "monthly" },
  { path: "/trust", priority: 0.4, freq: "monthly" },
  { path: "/terms", priority: 0.3, freq: "monthly" },
  { path: "/privacy", priority: 0.3, freq: "monthly" },
  { path: "/escrow-terms", priority: 0.3, freq: "monthly" },
  { path: "/creator-agreement", priority: 0.3, freq: "monthly" },
  { path: "/brand-agreement", priority: 0.3, freq: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC.map((s) => ({
    url: `${SITE_URL}${s.path}`,
    lastModified: now,
    changeFrequency: s.freq,
    priority: s.priority,
  }));

  for (const post of JOURNAL) {
    const image = journalImage(post);
    entries.push({
      url: `${SITE_URL}/journal/${post.slug}`,
      lastModified: new Date(`${post.date}T12:00:00Z`),
      changeFrequency: "monthly",
      priority: 0.7,
      images: [`${SITE_URL}${image.src}`],
    });
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createAdminClient();
      const [{ data: creators }, { data: docs }, { data: briefs }, { data: campaigns }] = await Promise.all([
        admin.from("creator_profiles").select("handle, updated_at").eq("is_live", true).eq("suspended", false).limit(5000),
        admin.from("doc_pages").select("slug, updated_at").eq("published", true).limit(500),
        admin.from("briefs").select("id, updated_at, brand:brand_profiles!inner(verification_status)").eq("status", "open").eq("brand.verification_status", "verified").limit(2000),
        admin.from("campaigns").select("id, updated_at, brand:brand_profiles!inner(verification_status)").eq("funded", true).neq("status", "draft").eq("brand.verification_status", "verified").limit(2000),
      ]);
      for (const c of creators ?? []) {
        if (!c.handle) continue;
        entries.push({
          url: `${SITE_URL}/@${c.handle}`,
          lastModified: c.updated_at ? new Date(c.updated_at) : now,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
      for (const b of briefs ?? []) {
        entries.push({
          url: `${SITE_URL}/briefs/${b.id}`,
          lastModified: b.updated_at ? new Date(b.updated_at) : now,
          changeFrequency: "daily",
          priority: 0.6,
        });
      }
      for (const c of campaigns ?? []) {
        entries.push({
          url: `${SITE_URL}/campaigns/${c.id}`,
          lastModified: c.updated_at ? new Date(c.updated_at) : now,
          changeFrequency: "daily",
          priority: 0.6,
        });
      }
      for (const d of docs ?? []) {
        entries.push({
          url: `${SITE_URL}/docs/${d.slug}`,
          lastModified: d.updated_at ? new Date(d.updated_at) : now,
          changeFrequency: "monthly",
          priority: 0.5,
        });
      }
    } catch {
      // DB unavailable, return static entries only.
    }
  }

  return entries;
}
