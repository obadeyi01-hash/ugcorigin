import Link from "next/link";
import { Compass } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center">
        <Container className="py-24 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent-tint text-accent">
            <Compass className="size-7" />
          </div>
          <p className="mt-6 font-display text-sm font-semibold uppercase tracking-widest text-accent">404</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
            This page took a wrong turn
          </h1>
          <p className="mx-auto mt-3 max-w-md text-ink-2">
            The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back to real, verified creators.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/"><Button>Back to home</Button></Link>
            <Link href="/creators"><Button variant="secondary">Find creators</Button></Link>
            <Link href="/briefs"><Button variant="ghost">Browse briefs</Button></Link>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
