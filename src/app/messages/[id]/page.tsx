import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Container } from "@/components/ui/container";
import { ChatPanel } from "@/components/messages/chat-panel";
import { createClient } from "@/lib/supabase/server";
import type { ChatMessage } from "@/app/messages/actions";

export const metadata: Metadata = { title: "Messages" };

async function ThreadInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/dashboard");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: conv } = await supabase
    .from("conversations")
    .select("id, brand_id, creator_id")
    .eq("id", id)
    .maybeSingle();
  if (!conv || (conv.brand_id !== user.id && conv.creator_id !== user.id)) notFound();

  const otherId = conv.brand_id === user.id ? conv.creator_id : conv.brand_id;
  const otherIsCreator = otherId === conv.creator_id;

  const [{ data: other }, { data: contract }, { data: msgs }] = await Promise.all([
    otherIsCreator
      ? supabase.from("creator_profiles").select("display_name, handle").eq("id", otherId).maybeSingle()
      : supabase.from("brand_profiles").select("company_name").eq("id", otherId).maybeSingle(),
    supabase
      .from("gigs")
      .select("id")
      .eq("brand_id", conv.brand_id)
      .eq("creator_id", conv.creator_id)
      .in("status", ["funded", "in_progress", "in_review", "revision", "approved", "released", "completed"])
      .limit(1)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("id, sender_id, body, attachment_url, attachment_name, attachment_kind, flagged, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true })
      .limit(200),
  ]);

  const otherName =
    (other as { display_name?: string; handle?: string; company_name?: string } | null)?.display_name ||
    (other as { company_name?: string } | null)?.company_name ||
    (other as { handle?: string } | null)?.handle ||
    "Conversation";

  return (
    <Container className="py-8">
      <Link href="/messages" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-ink">
        <ArrowLeft className="size-4" /> All messages
      </Link>
      <div className="mt-4 max-w-2xl">
        <ChatPanel
          conversationId={id}
          currentUserId={user.id}
          otherName={otherName}
          canShareContact={!!contract}
          initialMessages={(msgs ?? []) as ChatMessage[]}
        />
      </div>
    </Container>
  );
}

export default function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Suspense fallback={<div className="min-h-dvh" />}>
          <ThreadInner params={params} />
        </Suspense>
      </main>
    </>
  );
}
