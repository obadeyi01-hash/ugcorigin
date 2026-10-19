import type { Metadata } from "next";
import { Suspense } from "react";
import { LegalDoc } from "@/components/layout/legal-doc";

export const metadata: Metadata = { title: "Creator Agreement", alternates: { canonical: "/creator-agreement" } };

export default function CreatorAgreementPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <LegalDoc slug="creator-agreement" fallbackTitle="Creator Agreement" />
    </Suspense>
  );
}
