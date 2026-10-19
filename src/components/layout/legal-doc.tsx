import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { Markdown } from "@/components/ui/markdown";
import { createClient } from "@/lib/supabase/server";

/**
 * Renders a legal page from the admin-editable `doc_pages` table (category
 * "Legal"), so the content can be reviewed and adjusted from /admin/docs. Falls
 * back to a short notice only if the page hasn't been seeded / the backend
 * isn't connected.
 */
export async function LegalDoc({ slug, fallbackTitle }: { slug: string; fallbackTitle: string }) {
  let title = fallbackTitle;
  let body: string | null = null;
  let updatedAt: string | null = null;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("doc_pages")
      .select("title, body, updated_at, published")
      .eq("slug", slug)
      .maybeSingle();
    if (data && data.published) {
      title = data.title;
      body = data.body;
      updatedAt = data.updated_at;
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-14">
          <article className="mx-auto max-w-2xl">
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h1>
            {updatedAt && (
              <p className="mt-2 text-sm text-ink-3">Last updated {new Date(updatedAt).toLocaleDateString()}</p>
            )}
            <div className="mt-6">
              {body ? (
                <Markdown body={body} />
              ) : (
                <div className="rounded-2xl border border-warning/30 bg-warning/10 p-5 text-sm text-ink">
                  This document is being finalized. Questions? Reach us at{" "}
                  <a href="mailto:legal@ugcorigin.com" className="text-accent hover:underline">legal@ugcorigin.com</a>.
                </div>
              )}
            </div>
            <p className="mt-10 text-xs text-ink-3">
              A product by Dream Intrepid Ltd. · <Link href="/support" className="text-accent hover:underline">Contact support</Link>
            </p>
          </article>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
