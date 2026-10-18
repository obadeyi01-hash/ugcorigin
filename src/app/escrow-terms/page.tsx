import type { Metadata } from "next";
import { LegalNotice } from "@/components/layout/simple-page";

export const metadata: Metadata = { title: "Escrow & Payment Terms" };

export default function EscrowTermsPage() {
  return <LegalNotice title="Escrow & Payment Terms" />;
}
