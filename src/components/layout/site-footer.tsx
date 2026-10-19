import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Container } from "@/components/ui/container";
import { CurrentYear } from "@/components/ui/year";
import { CookiePreferences } from "@/components/analytics/analytics";

const columns = [
  {
    title: "For Brands",
    links: [
      ["Why UGCOrigin", "/for-brands"],
      ["Find creators", "/creators"],
      ["Post a brief", "/briefs/new"],
      ["Campaigns", "/campaigns"],
      ["Pricing", "/pricing"],
    ],
  },
  {
    title: "For Creators",
    links: [
      ["Why UGCOrigin", "/for-creators"],
      ["Become a creator", "/signup?role=creator"],
      ["Find briefs", "/briefs"],
      ["Leaderboard", "/leaderboard"],
      ["Browse services", "/services"],
      ["Pricing", "/pricing"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About", "/about"],
      ["Trust & Safety", "/trust"],
      ["Documentation", "/docs"],
      ["Services", "/services"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Terms", "/terms"],
      ["Privacy", "/privacy"],
      ["Escrow terms", "/escrow-terms"],
      ["Creator agreement", "/creator-agreement"],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <Container className="py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="flex flex-col gap-3">
            <Logo variant="combined" />
            <p className="max-w-xs text-sm text-ink-2">
              The creator network for original, human, verified content. Nigeria-first.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <h3 className="font-display text-sm font-semibold text-ink">
                {col.title}
              </h3>
              <ul className="flex flex-col gap-2">
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-ink-2 transition-colors hover:text-ink"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-line pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-ink-3">
            © <CurrentYear /> UGCOrigin. A product by Dream Intrepid Ltd.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-ink-3">Made for real creators. No AI slop.</span>
            <span className="text-xs"><CookiePreferences /></span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
