import { HeaderClient } from "@/components/layout/header-client";

const nav = [
  { label: "Find creators", href: "/creators" },
  { label: "Services", href: "/services" },
  { label: "Briefs", href: "/briefs" },
  { label: "Campaigns", href: "/campaigns" },
  { label: "Pricing", href: "/pricing" },
];

export function SiteHeader() {
  return <HeaderClient nav={nav} />;
}
