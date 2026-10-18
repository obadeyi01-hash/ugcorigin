import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { Markdown } from "@/components/ui/markdown";
import { createClient } from "@/lib/supabase/server";

type Doc = { slug: string; title: string; category: string; body: string };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { title: "Documentation" };
  const supabase = await createClient();
  const { data } = await supabase.from("doc_pages").select("title").eq("slug", slug).eq("published", true).maybeSingle();
  return { title: data?.title ?? "Documentation" };
}

async function DocInner({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) notFound();

  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("doc_pages")
    .select("slug, title, category, body")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (!doc) notFound();
  const d = doc as Doc;

  const { data: siblings } = await supabase
    .from("doc_pages")
    .select("slug, title")
    .eq("category", d.category)
    .eq("published", true)
    .order("sort", { ascending: true });

  return (
    <Container className="py-12">
      <Link href="/docs" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-ink">
        <ArrowLeft className="size-4" /> All documentation
      </Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_220px]">
        <article className="max-w-2xl">
          <p className="font-display text-xs font-semibold uppercase tracking-wide text-accent">{d.category}</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">{d.title}</h1>
          <div className="mt-4">
            <Markdown body={d.body} />
          </div>
        </article>

        {siblings && siblings.length > 1 && (
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <p className="font-display text-xs font-semibold uppercase tracking-wide text-ink-3">{d.category}</p>
            <ul className="mt-3 space-y-1.5">
              {siblings.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/docs/${s.slug}`}
                    className={s.slug === d.slug ? "text-sm font-medium text-accent" : "text-sm text-ink-2 hover:text-ink"}
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </Container>
  );
}

export default function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Suspense fallback={<div className="min-h-dvh" />}>
          <DocInner params={params} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
