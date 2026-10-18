import type { Metadata } from "next";
import { LegalNotice } from "@/components/layout/simple-page";

export const metadata: Metadata = { title: "Creator Agreement" };

export default function CreatorAgreementPage() {
  return <LegalNotice title="Creator Agreement" />;
}
