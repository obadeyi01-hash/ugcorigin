import type { Metadata } from "next";
import { LegalNotice } from "@/components/layout/simple-page";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return <LegalNotice title="Terms of Service" />;
}
