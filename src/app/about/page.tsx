import type { Metadata } from "next";
import { SimplePage } from "@/components/layout/simple-page";

export const metadata: Metadata = {
  title: "About",
  description: "UGCOrigin is the creator network for original, human, verified content, Nigeria-first.",
};

export default function AboutPage() {
  return (
    <SimplePage title="About UGCOrigin" intro="The home of original, human, verified content.">
      <p>In a world flooded with synthetic, AI-generated media, UGCOrigin is the creator network for content made by real, verified humans. We connect brands with creators who make authentic UGC that converts, and we make sure everyone gets paid fairly and on time.</p>
      <h2>Nigeria-first</h2>
      <p>We&apos;re building for Nigerian creators and brands first, local payments, local culture, payment protection that works here, then expanding across Africa and beyond.</p>
      <h2>How we&apos;re different</h2>
      <p>Payment protection on every deal, identity-verified creators, a clean workspace from brief to approval, and a strong stand for original human content over AI slop.</p>
    </SimplePage>
  );
}
