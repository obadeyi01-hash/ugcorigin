import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { MapPin, Store } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Services",
  description: "Browse ready-to-buy UGC packages from verified Nigerian creators.",
};

type SP = { page?: string };

const PAGE_SIZE = 24;

type Row = {
  id: string; title: string; type: string; price_naira: number; format: string | null;
  creator: { handle: string; display_name: string | null; location: string | null } | null;
};

async function Inner({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  let page = Math.max(1, Number(sp.page) || 1);
  let total = 0;
  let rows: Row[] = [];
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = await createClient();
    // RLS returns only active packages of live creators for public viewers.
    const { count } = await supabase
      .from("packages")
      .select("id", { count: "exact", head: true })
      .eq("active", true);
    total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (page > totalPages) page = totalPages;
    const from = (page - 1) * PAGE_SIZE;
    const { data } = await supabase
      .from("packages")
      .select("id, title, type, price_naira, format, creator:creator_profiles(handle, display_name, location)")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    rows = (data ?? []) as unknown as Row[];
  }

  if (rows.length === 0) {
    return (
      <div className="mt-8 rounded-3xl border border-line bg-surface px-6 py-16 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent-tint text-accent"><Store className="size-6" /></div>
        <h2 className="mt-4 font-display text-xl font-semibold text-ink">No services listed yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">As creators go live and publish packages, their ready-to-buy services appear here.</p>
        <Link href="/creators" className="mt-5 inline-block"><Button>Browse creators</Button></Link>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => (p > 1 ? `/services?page=${p}` : "/services");

  return (
    <>
    {totalPages > 1 && (
      <p className="mt-6 text-sm text-ink-3">{total} service{total === 1 ? "" : "s"} · page {page} of {totalPages}</p>
    )}
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((p) => (
        <Card key={p.id} interactive className="h-full">
          <CardBody>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display font-semibold text-ink">{p.title}</h3>
              <span className="shrink-0 rounded-full bg-accent-tint px-2 py-0.5 text-xs font-medium capitalize text-accent-hover">{p.type}</span>
            </div>
            {p.format && <p className="mt-1 text-xs text-ink-3">{p.format}</p>}
            {p.creator?.handle && (
              <Link href={`/${p.creator.handle}`} className="mt-3 block text-sm font-medium text-ink hover:text-accent">
                {p.creator.display_name || `@${p.creator.handle}`}
              </Link>
            )}
            {p.creator?.location && <p className="flex items-center gap-1 text-xs text-ink-3"><MapPin className="size-3" /> {p.creator.location}</p>}
            <p className="mt-4 border-t border-line pt-3 font-display text-lg font-bold text-ink">{formatNaira(p.price_naira)}</p>
          </CardBody>
        </Card>
      ))}
    </div>

    {totalPages > 1 && (
      <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
        {page > 1 && (
          <Link href={qs(page - 1)} className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:border-accent hover:text-accent">Previous</Link>
        )}
        <span className="px-2 text-sm text-ink-3">{page} / {totalPages}</span>
        {page < totalPages && (
          <Link href={qs(page + 1)} className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:border-accent hover:text-accent">Next</Link>
        )}
      </nav>
    )}
    </>
  );
}

export default function ServicesPage({ searchParams }: { searchParams: Promise<SP> }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-10 sm:py-14">
          <div className="max-w-2xl">
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Services</h1>
            <p className="mt-2 text-ink-2">Ready-to-buy UGC packages from verified creators, pick one and send an offer.</p>
          </div>
          <Suspense fallback={<div className="mt-8 h-40 animate-pulse rounded-2xl bg-surface-2" />}><Inner searchParams={searchParams} /></Suspense>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
