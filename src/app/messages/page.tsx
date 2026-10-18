import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Container } from "@/components/ui/container";
import { Card, CardBody } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Messages" };

async function InboxInner() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/dashboard");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: convs } = await supabase
    .from("conversations")
    .select("id, brand_id, creator_id, last_message_at")
    .order("last_message_at", { ascending: false })
    .limit(100);
  const list = convs ?? [];

  const creatorIds = list.filter((c) => c.creator_id !== user.id).map((c) => c.creator_id);
  const brandIds = list.filter((c) => c.brand_id !== user.id).map((c) => c.brand_id);
  const names = new Map<string, string>();
  await Promise.all([
    creatorIds.length
      ? supabase.from("creator_profiles").select("id, display_name, handle").in("id", creatorIds).then(({ data }) =>
          (data ?? []).forEach((c) => names.set(c.id, c.display_name || `@${c.handle}`)),
        )
      : Promise.resolve(),
    brandIds.length
      ? supabase.from("brand_profiles").select("id, company_name").in("id", brandIds).then(({ data }) =>
          (data ?? []).forEach((b) => names.set(b.id, b.company_name || "Brand")),
        )
      : Promise.resolve(),
  ]);

  return (
    <Container className="py-10">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Messages</h1>
      {list.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-line bg-surface px-6 py-16 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent-tint text-accent">
            <MessageSquare className="size-6" />
          </div>
          <p className="mt-4 text-ink-2">No conversations yet. Message a creator from their profile to start one.</p>
        </div>
      ) : (
        <Card className="mt-6 max-w-2xl">
          <CardBody className="p-0">
            <ul className="divide-y divide-line">
              {list.map((c) => {
                const otherId = c.brand_id === user.id ? c.creator_id : c.brand_id;
                return (
                  <li key={c.id}>
                    <Link href={`/messages/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-surface-2">
                      <span className="font-medium text-ink">{names.get(otherId) || "Conversation"}</span>
                      <span className="text-xs text-ink-3">{new Date(c.last_message_at).toLocaleDateString()}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      )}
    </Container>
  );
}

export default function MessagesPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Suspense fallback={<div className="min-h-dvh" />}>
          <InboxInner />
        </Suspense>
      </main>
    </>
  );
}
