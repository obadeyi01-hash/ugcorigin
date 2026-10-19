import type { Metadata } from "next";
import { Suspense } from "react";
import { LegalDoc } from "@/components/layout/legal-doc";

export const metadata: Metadata = { title: "Brand Agreement", alternates: { canonical: "/brand-agreement" } };

export default function BrandAgreementPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <LegalDoc slug="brand-agreement" fallbackTitle="Brand Agreement" />
    </Suspense>
  );
}
