import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";

export function SimplePage({ title, intro, children }: { title: string; intro?: string; children?: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-14">
          <div className="mx-auto max-w-2xl">
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h1>
            {intro && <p className="mt-3 text-lg text-ink-2">{intro}</p>}
            {children && <div className="mt-8 space-y-4 text-ink-2 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink [&_h2]:mt-8 [&_a]:text-accent [&_a:hover]:underline">{children}</div>}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

export function LegalNotice({ title }: { title: string }) {
  return (
    <SimplePage title={title} intro="This document is being finalized with our legal counsel ahead of launch.">
      <div className="rounded-2xl border border-warning/30 bg-warning/10 p-5 text-sm text-ink">
        We&apos;re putting the final touches on our {title.toLowerCase()} with qualified legal counsel. In the meantime, if you have questions, reach us at{" "}
        <a href="mailto:legal@ugcorigin.com">legal@ugcorigin.com</a>.
      </div>
      <p className="text-sm text-ink-3">A product by Dream Intrepid Ltd.</p>
    </SimplePage>
  );
}
