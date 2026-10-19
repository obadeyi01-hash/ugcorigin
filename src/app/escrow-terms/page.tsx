import type { Metadata } from "next";
import { Suspense } from "react";
import { LegalDoc } from "@/components/layout/legal-doc";

export const metadata: Metadata = { title: "Escrow Terms", alternates: { canonical: "/escrow-terms" } };

export default function EscrowTermsPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <LegalDoc slug="escrow-terms" fallbackTitle="Escrow Terms" />
    </Suspense>
  );
}
