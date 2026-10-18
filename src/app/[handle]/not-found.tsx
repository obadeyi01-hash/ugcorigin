import Link from "next/link";
import { UserX } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export default function CreatorNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center">
        <Container className="py-24 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent-tint text-accent">
            <UserX className="size-7" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-ink">
            This creator isn&apos;t here
          </h1>
          <p className="mx-auto mt-3 max-w-md text-ink-2">
            That handle doesn&apos;t exist, or the creator hasn&apos;t gone live yet. Explore verified creators who are ready to work.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/creators"><Button>Find creators</Button></Link>
            <Link href="/"><Button variant="ghost">Back to home</Button></Link>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
