import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { Container } from "@/components/ui/container";
import { Card, CardBody } from "@/components/ui/card";
import { MarkAllRead } from "@/components/layout/mark-all-read";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

function ago(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

type Notif = { id: string; title: string | null; body: string | null; href: string | null; read: boolean; created_at: string };

async function NotificationsInner() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/dashboard");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, href, read, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  const items = (data as Notif[]) ?? [];
  const hasUnread = items.some((n) => !n.read);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Notifications</h1>
        {hasUnread && <MarkAllRead userId={user.id} />}
      </div>

      <div className="mt-6">
        {items.length === 0 ? (
          <Card variant="outline"><CardBody className="py-16 text-center text-ink-2">You&apos;re all caught up.</CardBody></Card>
        ) : (
          <Card>
            <CardBody className="p-0">
              <ul className="divide-y divide-line">
                {items.map((n) => {
                  const inner = (
                    <span className="flex gap-3">
                      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-accent")} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-medium text-ink">{n.title}</span>
                          <span className="shrink-0 text-xs text-ink-3">{ago(n.created_at)}</span>
                        </span>
                        {n.body && <span className="mt-0.5 block text-sm text-ink-2">{n.body}</span>}
                      </span>
                    </span>
                  );
                  return (
                    <li key={n.id} className={cn(!n.read && "bg-accent-tint/30")}>
                      {n.href ? (
                        <Link href={n.href} className="block px-4 py-3.5 hover:bg-surface-2">{inner}</Link>
                      ) : (
                        <div className="px-4 py-3.5">{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}

export default function NotificationsPage() {
  return (
    <>
      <header className="border-b border-line bg-paper/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/"><Logo variant="combined" size={30} /></Link>
          <Link href="/dashboard" className="text-sm font-medium text-ink-2 hover:text-ink">Dashboard</Link>
        </Container>
      </header>
      <Container className="py-10">
        <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-surface-2" />}>
          <NotificationsInner />
        </Suspense>
      </Container>
    </>
  );
}
