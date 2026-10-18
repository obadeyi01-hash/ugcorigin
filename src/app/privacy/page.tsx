import type { Metadata } from "next";
import { LegalNotice } from "@/components/layout/simple-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return <LegalNotice title="Privacy Policy" />;
}
