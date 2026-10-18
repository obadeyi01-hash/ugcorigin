"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { guardWrite } from "@/lib/admin/rbac";

type Res = { ok?: boolean; error?: string; id?: string };

export type DocInput = {
  id?: string;
  slug: string;
  title: string;
  category: string;
  body: string;
  published: boolean;
  sort: number;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function saveDoc(input: DocInput): Promise<Res> {
  const { ctx, error } = await guardWrite("docs");
  if (error || !ctx) return { error: error ?? "Not permitted." };

  const title = input.title.trim();
  if (!title) return { error: "Title can’t be empty." };
  const slug = slugify(input.slug || title);
  if (!slug) return { error: "Needs a valid slug." };

  const admin = createAdminClient();
  const row = {
    slug,
    title,
    category: input.category.trim() || "General",
    body: input.body,
    published: input.published,
    sort: Math.round(input.sort) || 0,
    updated_at: new Date().toISOString(),
    updated_by: ctx.userId,
  };

  if (input.id) {
    const { data: before } = await admin.from("doc_pages").select("slug, title, published").eq("id", input.id).maybeSingle();
    const { error: e } = await admin.from("doc_pages").update(row).eq("id", input.id);
    if (e) return { error: e.code === "23505" ? "That slug is already used." : e.message };
    await admin.from("audit_log").insert({ actor_id: ctx.userId, action: "doc.update", target_type: "doc_page", target_id: input.id, before, after: { slug, title, published: input.published } });
    revalidatePath("/admin/docs");
    revalidatePath(`/docs/${slug}`);
    revalidatePath("/docs");
    return { ok: true, id: input.id };
  }

  const { data, error: e } = await admin.from("doc_pages").insert(row).select("id").single();
  if (e) return { error: e.code === "23505" ? "That slug is already used." : e.message };
  await admin.from("audit_log").insert({ actor_id: ctx.userId, action: "doc.create", target_type: "doc_page", target_id: data.id, before: null, after: { slug, title } });
  revalidatePath("/admin/docs");
  revalidatePath("/docs");
  return { ok: true, id: data.id };
}

export async function deleteDoc(id: string): Promise<Res> {
  const { ctx, error } = await guardWrite("docs");
  if (error || !ctx) return { error: error ?? "Not permitted." };
  const admin = createAdminClient();
  const { data: before } = await admin.from("doc_pages").select("slug, title").eq("id", id).maybeSingle();
  const { error: e } = await admin.from("doc_pages").delete().eq("id", id);
  if (e) return { error: e.message };
  await admin.from("audit_log").insert({ actor_id: ctx.userId, action: "doc.delete", target_type: "doc_page", target_id: id, before, after: null });
  revalidatePath("/admin/docs");
  revalidatePath("/docs");
  return { ok: true };
}
