import type { Metadata } from "next";
import { Suspense } from "react";
import { LegalDoc } from "@/components/layout/legal-doc";

export const metadata: Metadata = {
  title: "Payment protection terms",
  alternates: { canonical: "/payment-protection-terms" },
};

export default function PaymentProtectionTermsPage() {
  // The legal document is stored under the `escrow-terms` slug in the
  // admin-editable doc_pages table (an internal identifier, left unchanged);
  // only the user-facing title is reworded here.
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <LegalDoc slug="escrow-terms" fallbackTitle="Payment protection terms" />
    </Suspense>
  );
}
