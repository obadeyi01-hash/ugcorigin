"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2, Loader2, Check, ExternalLink } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { saveDoc, deleteDoc, type DocInput } from "@/app/admin/docs/actions";

export type DocRowData = {
  id: string;
  slug: string;
  title: string;
  category: string;
  body: string;
  published: boolean;
  sort: number;
  updated_at: string;
};

export function DocsAdmin({ docs, readonly }: { docs: DocRowData[]; readonly: boolean }) {
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      {!readonly && (
        <div>
          {creating ? (
            <DocEditor onClose={() => setCreating(false)} />
          ) : (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="size-4" /> New document
            </Button>
          )}
        </div>
      )}

      <Card>
        <CardBody className="p-0">
          <ul className="divide-y divide-line">
            {docs.map((d) => (
              <DocRow key={d.id} doc={d} readonly={readonly} />
            ))}
            {docs.length === 0 && <li className="p-6 text-center text-sm text-ink-3">No documents yet.</li>}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

function DocRow({ doc, readonly }: { doc: DocRowData; readonly: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  if (editing) return <li className="p-4"><DocEditor doc={doc} onClose={() => setEditing(false)} /></li>;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-ink">{doc.title}</span>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-ink-3">{doc.category}</span>
          {!doc.published && <span className="rounded-full bg-warning/14 px-2 py-0.5 text-[11px] font-medium text-warning">Draft</span>}
        </div>
        <p className="mt-0.5 text-xs text-ink-3">
          /docs/{doc.slug} · updated {new Date(doc.updated_at).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link href={`/docs/${doc.slug}`} className="text-ink-3 hover:text-ink" aria-label="View"><ExternalLink className="size-4" /></Link>
        {!readonly && (
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}><Pencil className="size-4" /> Edit</Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => {
                if (!confirm(`Delete "${doc.title}"? This can’t be undone.`)) return;
                start(async () => {
                  await deleteDoc(doc.id);
                  router.refresh();
                });
              }}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

function DocEditor({ doc, onClose }: { doc?: DocRowData; onClose: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState(doc?.title ?? "");
  const [slug, setSlug] = useState(doc?.slug ?? "");
  const [category, setCategory] = useState(doc?.category ?? "General");
  const [sort, setSort] = useState(String(doc?.sort ?? 0));
  const [published, setPublished] = useState(doc?.published ?? true);
  const [body, setBody] = useState(doc?.body ?? "");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function submit() {
    setError(null);
    const input: DocInput = { id: doc?.id, slug, title, category, body, published, sort: Number(sort) || 0 };
    start(async () => {
      const r = await saveDoc(input);
      if (r.error) {
        setError(r.error);
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 700);
    });
  }

  return (
    <div className="rounded-2xl border border-line bg-surface-2/40 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Fees & payments" /></Field>
        <Field label="Slug" hint="URL: /docs/your-slug (auto from title if blank)">
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="fees-and-payments" />
        </Field>
        <Field label="Category"><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Payments & fees" /></Field>
        <Field label="Sort order" hint="Lower shows first within a category">
          <Input type="number" value={sort} onChange={(e) => setSort(e.target.value)} />
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Body" hint="Markdown: ## heading, ### sub, - bullets, 1. steps, **bold**, [link](https://…)">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-64 font-mono text-xs leading-relaxed" />
        </Field>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button
          type="button"
          role="switch"
          aria-checked={published}
          onClick={() => setPublished((p) => !p)}
          className="inline-flex items-center gap-2 text-sm text-ink-2"
        >
          <span className={cn("relative h-5 w-9 rounded-full transition-colors", published ? "bg-accent" : "bg-surface-2 border border-line")}>
            <span className={cn("absolute top-0.5 size-4 rounded-full bg-paper shadow transition-transform", published ? "translate-x-4" : "translate-x-0.5")} />
          </span>
          {published ? "Published" : "Draft"}
        </button>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={pending}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null} Save
          </Button>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}
