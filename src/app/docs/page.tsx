import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { Card, CardBody } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Documentation",
  description: "How UGCOrigin works, fees, payment protection, payouts, trust & safety, and guides for brands and creators.",
};

type Doc = { slug: string; title: string; category: string };

async function DocsInner() {
  let docs: Doc[] = [];
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("doc_pages")
      .select("slug, title, category")
      .eq("published", true)
      .order("category", { ascending: true })
      .order("sort", { ascending: true });
    docs = (data ?? []) as Doc[];
  }

  const byCategory = new Map<string, Doc[]>();
  for (const d of docs) {
    const list = byCategory.get(d.category) ?? [];
    list.push(d);
    byCategory.set(d.category, list);
  }

  return (
    <Container className="py-14">
      <div className="max-w-2xl">
        <div className="inline-grid size-12 place-items-center rounded-2xl bg-accent-tint text-accent">
          <BookOpen className="size-6" />
        </div>
        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Documentation</h1>
        <p className="mt-3 text-lg text-ink-2">
          Exactly how UGCOrigin works, fees and payments, payment protection, getting paid, and how we keep every deal safe.
        </p>
      </div>

      {docs.length === 0 ? (
        <p className="mt-10 text-sm text-ink-3">Documentation is being set up, check back shortly.</p>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {[...byCategory.entries()].map(([category, list]) => (
            <div key={category}>
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-3">{category}</h2>
              <Card className="mt-3">
                <CardBody className="p-0">
                  <ul className="divide-y divide-line">
                    {list.map((d) => (
                      <li key={d.slug}>
                        <Link
                          href={`/docs/${d.slug}`}
                          className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-ink hover:bg-surface-2"
                        >
                          {d.title}
                          <ArrowRight className="size-4 text-ink-3" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}

export default function DocsPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Suspense fallback={<div className="min-h-dvh" />}>
          <DocsInner />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
