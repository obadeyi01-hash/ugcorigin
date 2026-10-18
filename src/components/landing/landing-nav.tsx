import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

/**
 * Slim header for conversion landing pages, logo + a single primary CTA, and
 * no full nav, to keep ad traffic focused on the one action (fewer exit leaks).
 */
export function LandingNav({ ctaLabel, ctaHref }: { ctaLabel: string; ctaHref: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/75 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" aria-label="UGCOrigin">
          <Logo variant="combined" size={30} />
        </Link>
        <Link href={ctaHref}>
          <Button size="sm">{ctaLabel}</Button>
        </Link>
      </Container>
    </header>
  );
}
