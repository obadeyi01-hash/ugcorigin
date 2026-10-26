import { JOURNAL, journalImage } from "@/content/journal";
import { SITE_URL } from "@/components/seo/json-ld";

export function GET() {
  const items = [...JOURNAL].reverse().map((post) => {
    const image = journalImage(post);
    const link = `${SITE_URL}/journal/${post.slug}`;
    return `<item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${new Date(`${post.date}T12:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(post.description)}</description>
      <enclosure url="${SITE_URL}${image.src}" type="image/svg+xml" />
    </item>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>UGCOrigin Journal</title>
    <link>${SITE_URL}/journal</link>
    <description>Daily notes on hiring verified creators in Nigeria.</description>
    ${items.join("\n")}
  </channel>
</rss>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
