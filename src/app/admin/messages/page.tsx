import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminShellSkeleton } from "@/components/admin/admin-shell-skeleton";
import { Card, CardBody } from "@/components/ui/card";
import { AdminListControls } from "@/components/admin/list-controls";
import { requireSection } from "@/lib/admin/rbac";
import { createClient } from "@/lib/supabase/server";
import { pageCount, pageWindow, readPage, readQuery } from "@/lib/admin/list";

export const metadata: Metadata = { title: "Admin · Messages" };

async function MessagesInner({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { role } = await requireSection("messages");
  const sp = await searchParams;
  const c = sp.c;
  const q = readQuery(sp.q);
  const page = readPage(sp.page);
  const window = pageWindow(page);
  const supabase = await createClient();

  let convQuery = supabase
    .from("conversations")
    .select("id, brand_id, creator_id, last_message_at", { count: "exact" })
    .order("last_message_at", { ascending: false });
  if (q) {
    const [{ data: creators }, { data: brands }] = await Promise.all([
      supabase.from("creator_profiles").select("id").or(`handle.ilike.%${q}%,display_name.ilike.%${q}%`).limit(40),
      supabase.from("brand_profiles").select("id").ilike("company_name", `%${q}%`).limit(40),
    ]);
    const ids = [...new Set([...(creators ?? []).map((row) => row.id), ...(brands ?? []).map((row) => row.id)])];
    if (ids.length === 0) convQuery = convQuery.eq("id", "00000000-0000-0000-0000-000000000000");
    else convQuery = convQuery.or(ids.flatMap((id) => [`creator_id.eq.${id}`, `brand_id.eq.${id}`]).join(","));
  }
  const { data: convs, count } = await convQuery.range(window.from, window.to);
  const pages = pageCount(count);
  const list = convs ?? [];

  let thread: { id: string; sender_id: string; body: string; flagged: boolean; attachment_name: string | null; created_at: string }[] = [];
  let parties = { brand: "Brand", creator: "Creator", brandId: "", creatorId: "" };
  if (c) {
    const sel = list.find((x) => x.id === c);
    if (sel) {
      const [{ data: msgs }, { data: cr }, { data: br }] = await Promise.all([
        supabase.from("messages").select("id, sender_id, body, flagged, attachment_name, created_at").eq("conversation_id", c).order("created_at", { ascending: true }).limit(500),
        supabase.from("creator_profiles").select("display_name, handle").eq("id", sel.creator_id).maybeSingle(),
        supabase.from("brand_profiles").select("company_name").eq("id", sel.brand_id).maybeSingle(),
      ]);
      thread = msgs ?? [];
      parties = {
        brand: br?.company_name || "Brand",
        creator: cr?.display_name || `@${cr?.handle ?? ""}`,
        brandId: sel.brand_id,
        creatorId: sel.creator_id,
      };
    }
  }

  return (
    <AdminShell role={role} active="messages">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Messages</h1>
      <p className="mt-1 text-sm text-ink-2">Read-only oversight of brand to creator conversations.</p>
      <AdminListControls
        pathname="/admin/messages"
        q={q}
        placeholder="Creator or brand"
        page={Math.min(page, pages)}
        pages={pages}
        total={count ?? 0}
        hidden={{ c }}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <Card>
          <CardBody className="p-0">
            <ul className="max-h-[32rem] divide-y divide-line overflow-y-auto">
              {list.map((conv) => (
                <li key={conv.id}>
                  <Link
                    href={`/admin/messages?c=${conv.id}${q ? `&q=${encodeURIComponent(q)}` : ""}${page > 1 ? `&page=${page}` : ""}`}
                    className={`block px-4 py-3 text-sm hover:bg-surface-2 ${c === conv.id ? "bg-surface-2 font-medium text-ink" : "text-ink-2"}`}
                  >
                    {conv.id.slice(0, 8)}
                    <span className="block text-xs text-ink-3">{new Date(conv.last_message_at).toLocaleString()}</span>
                  </Link>
                </li>
              ))}
              {list.length === 0 && <li className="p-6 text-center text-sm text-ink-3">No conversations.</li>}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            {!c ? (
              <p className="py-12 text-center text-sm text-ink-3">Select a conversation to review it.</p>
            ) : (
              <>
                <p className="text-sm font-semibold text-ink">{parties.brand} <span className="text-ink-3">↔</span> {parties.creator}</p>
                <div className="mt-4 space-y-2">
                  {thread.map((m) => (
                    <div key={m.id} className="rounded-xl border border-line bg-surface-2/40 p-3 text-sm">
                      <p className="text-xs font-medium text-ink-3">
                        {m.sender_id === parties.brandId ? parties.brand : parties.creator} · {new Date(m.created_at).toLocaleString()}
                        {m.flagged && <span className="ml-1 text-warning">· contact hidden</span>}
                      </p>
                      {m.body && <p className="mt-1 whitespace-pre-wrap text-ink">{m.body}</p>}
                      {m.attachment_name && <p className="mt-1 text-xs text-ink-2">📎 {m.attachment_name}</p>}
                    </div>
                  ))}
                  {thread.length === 0 && <p className="text-sm text-ink-3">No messages.</p>}
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </AdminShell>
  );
}

export default function AdminMessagesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return (
    <Suspense fallback={<AdminShellSkeleton />}>
      <MessagesInner searchParams={searchParams} />
    </Suspense>
  );
}
