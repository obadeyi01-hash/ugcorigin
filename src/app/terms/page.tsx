import type { Metadata } from "next";
import { Suspense } from "react";
import { LegalDoc } from "@/components/layout/legal-doc";

export const metadata: Metadata = { title: "Terms of Service", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <LegalDoc slug="terms" fallbackTitle="Terms of Service" />
    </Suspense>
  );
}
