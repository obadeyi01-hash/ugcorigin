import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { JsonLd, SITE_URL } from "@/components/seo/json-ld";
import { JOURNAL, journalImage, journalPost } from "@/content/journal";

type Params = { slug: string };

function formatDay(iso: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date(`${iso}T12:00:00Z`));
}

export function generateStaticParams(): Params[] {
  return JOURNAL.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = journalPost(slug);
  if (!post) return { title: "Journal" };
  const image = journalImage(post);
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/journal/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `/journal/${post.slug}`,
      publishedTime: `${post.date}T00:00:00+01:00`,
      images: [{ url: image.src, alt: image.alt }],
    },
  };
}

export default async function JournalArticle({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = journalPost(slug);
  if (!post) notFound();
  const image = journalImage(post);
  const url = `${SITE_URL}/journal/${post.slug}`;
  const more = JOURNAL.filter((p) => p.slug !== post.slug).slice(-3).reverse();

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: `${post.date}T00:00:00+01:00`,
    dateModified: `${post.date}T00:00:00+01:00`,
    image: `${SITE_URL}${image.src}`,
    author: { "@type": "Organization", name: "UGCOrigin", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "UGCOrigin",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/favicon.png` },
    },
    mainEntityOfPage: url,
  };

  return (
    <>
      <JsonLd data={articleLd} />
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-14">
          <Link href="/journal" className="text-sm font-medium text-accent">Journal</Link>
          <article className="mx-auto mt-4 max-w-2xl">
            <time dateTime={post.date} className="text-sm text-ink-3">{formatDay(post.date)}</time>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">{post.title}</h1>
            <p className="mt-3 text-lg text-ink-2">{post.description}</p>
            <figure className="mt-8">
              <img src={image.src} alt={image.alt} width={1200} height={630} className="w-full rounded-3xl border border-line" />
              <figcaption className="mt-2 text-xs text-ink-3">{image.alt}</figcaption>
            </figure>
            <div className="mt-8 space-y-5 text-base leading-relaxed text-ink">
              {post.body.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
          </article>
          {more.length > 0 && (
            <aside className="mx-auto mt-14 max-w-2xl border-t border-line pt-8">
              <h2 className="font-display text-lg font-semibold text-ink">More from the journal</h2>
              <ul className="mt-4 grid gap-3">
                {more.map((item) => (
                  <li key={item.slug}>
                    <Link href={`/journal/${item.slug}`} className="text-sm font-medium text-ink hover:text-accent">
                      <time dateTime={item.date} className="mr-2 text-ink-3">{formatDay(item.date)}</time>
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
