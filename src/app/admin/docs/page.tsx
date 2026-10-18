import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DocsAdmin, type DocRowData } from "@/components/admin/docs-admin";
import { requireSection, isReadonly } from "@/lib/admin/rbac";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin · Docs" };

async function DocsInner() {
  const { role } = await requireSection("docs");
  const readonly = isReadonly(role);
  const supabase = await createClient();

  const { data } = await supabase
    .from("doc_pages")
    .select("id, slug, title, category, body, published, sort, updated_at")
    .order("category", { ascending: true })
    .order("sort", { ascending: true });

  return (
    <AdminShell role={role} active="docs">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Documentation</h1>
      <p className="mt-1 text-sm text-ink-2">The public help &amp; policy pages at <span className="font-medium text-ink">/docs</span>. Edits publish live.</p>
      <div className="mt-6">
        <DocsAdmin docs={(data ?? []) as DocRowData[]} readonly={readonly} />
      </div>
    </AdminShell>
  );
}

export default function AdminDocsPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <DocsInner />
    </Suspense>
  );
}
