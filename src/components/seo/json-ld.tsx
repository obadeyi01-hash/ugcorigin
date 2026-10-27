/**
 * Renders a JSON-LD <script> for structured data (SEO + answer/generative
 * engines). `<` is escaped to < so a value can never break out of the
 * script tag (safe even with dynamic creator bios).
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export const SITE_URL = "https://www.ugcorigin.com";
