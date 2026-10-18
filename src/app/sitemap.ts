import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/components/seo/json-ld";

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

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createAdminClient();
      const [{ data: creators }, { data: docs }] = await Promise.all([
        admin.from("creator_profiles").select("handle, updated_at").eq("is_live", true).limit(5000),
        admin.from("doc_pages").select("slug, updated_at").eq("published", true).limit(500),
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
