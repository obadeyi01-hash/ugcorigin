import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import { JsonLd, SITE_URL } from "@/components/seo/json-ld";
import { Analytics } from "@/components/analytics/analytics";
import { Toaster } from "@/components/ui/toaster";
import { SmoothScroll } from "@/components/layout/smooth-scroll";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.ugcorigin.com"),
  title: {
    default: "UGCOrigin, Hire real creators for original UGC",
    template: "%s · UGCOrigin",
  },
  description:
    "UGCOrigin is the creator network for original, human-made content. Hire identity-verified creators, pay safely through escrow, and get UGC that converts. Nigeria-first.",
  applicationName: "UGCOrigin",
  authors: [{ name: "Dream Intrepid Ltd." }],
  keywords: [
    "UGC creators Nigeria",
    "hire UGC creators",
    "Nigerian content creators",
    "user generated content",
    "verified creators",
    "influencer marketing Nigeria",
    "escrow creator payments",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "UGCOrigin, Hire real creators for original UGC",
    description:
      "Hire identity-verified human creators for authentic UGC. Escrow-protected. Nigeria-first.",
    siteName: "UGCOrigin",
    type: "website",
    locale: "en_NG",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    site: "@ugcorigin",
    creator: "@ugcorigin",
    title: "UGCOrigin, Hire real creators for original UGC",
    description: "Identity-verified human creators. Escrow-protected. Nigeria-first.",
  },
  ...siteVerification(),
};

function siteCode(value: string | undefined) {
  const clean = value?.trim() ?? "";
  return /^[A-Za-z0-9_-]{8,128}$/.test(clean) ? clean : null;
}

function siteVerification(): { verification: Metadata["verification"] } | Record<string, never> {
  const google = siteCode(process.env.GOOGLE_SITE_VERIFICATION);
  const bing = siteCode(process.env.BING_SITE_VERIFICATION);
  if (!google && !bing) return {};
  return {
    verification: {
      ...(google ? { google } : {}),
      ...(bing ? { other: { "msvalidate.01": bing } } : {}),
    },
  };
}

const orgLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "UGCOrigin",
  url: SITE_URL,
  logo: `${SITE_URL}/brand/favicon.png`,
  description:
    "UGCOrigin is the creator network for original, human, verified content, hire identity-verified creators with escrow-protected payments. Nigeria-first.",
  parentOrganization: { "@type": "Organization", name: "Dream Intrepid Ltd." },
  areaServed: { "@type": "Country", name: "Nigeria" },
};

const siteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "UGCOrigin",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/creators?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f7f5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <SmoothScroll />
        <JsonLd data={[orgLd, siteLd]} />
        <Toaster>{children}</Toaster>
        {/* usePathname() inside Analytics is runtime-only; stream it in so the
            rest of each route can still be prerendered (Next 16 cacheComponents). */}
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
      </body>
    </html>
  );
}
