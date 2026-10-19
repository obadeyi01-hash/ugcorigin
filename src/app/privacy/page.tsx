import type { Metadata } from "next";
import { Suspense } from "react";
import { LegalDoc } from "@/components/layout/legal-doc";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <LegalDoc slug="privacy" fallbackTitle="Privacy Policy" />
    </Suspense>
  );
}
