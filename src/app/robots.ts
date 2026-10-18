import type { MetadataRoute } from "next";
import { SITE_URL } from "@/components/seo/json-ld";

// Allow all crawlers (including AI/answer engines, good for AEO/GEO); keep
// private, authenticated surfaces out of the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/dashboard", "/settings", "/verify", "/offers", "/onboarding", "/gigs", "/auth", "/api"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
