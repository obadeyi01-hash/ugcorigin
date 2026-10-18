import type { Metadata } from "next";
import { LegalNotice } from "@/components/layout/simple-page";

export const metadata: Metadata = { title: "Brand Agreement" };

export default function BrandAgreementPage() {
  return <LegalNotice title="Brand Agreement" />;
}
