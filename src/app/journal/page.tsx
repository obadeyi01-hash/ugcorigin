import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { JOURNAL, journalImage } from "@/content/journal";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Notes on hiring verified creators in Nigeria: briefs, escrow, identity, and per-view campaigns. A new piece for each day the marketplace has been explaining itself.",
  alternates: { canonical: "/journal" },
};

function formatDay(iso: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date(`${iso}T12:00:00Z`));
}

export default function JournalIndex() {
  const posts = [...JOURNAL].reverse();
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-14">
          <p className="text-sm font-medium text-accent">Journal</p>
          <h1 className="mt-2 max-w-2xl font-display text-4xl font-bold tracking-tight text-ink">
            How hiring on UGCOrigin actually works
          </h1>
          <p className="mt-3 max-w-2xl text-ink-2">
            One piece a day since 1 October 2026. New posts are added in the same list the sitemap and the feed already read, so the public record grows with the product.
          </p>
          <ol className="mt-10 grid gap-6">
            {posts.map((post) => {
              const image = journalImage(post);
              return (
                <li key={post.slug}>
                  <Link href={`/journal/${post.slug}`} className="grid gap-4 rounded-3xl border border-line bg-surface p-4 sm:grid-cols-[220px_1fr] sm:p-5">
                    <img src={image.src} alt={image.alt} width={1200} height={630} className="h-40 w-full rounded-2xl object-cover" />
                    <div>
                      <time dateTime={post.date} className="text-xs font-medium text-ink-3">{formatDay(post.date)}</time>
                      <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">{post.title}</h2>
                      <p className="mt-2 text-sm text-ink-2">{post.description}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
