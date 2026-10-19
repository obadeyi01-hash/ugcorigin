import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardBody } from "@/components/ui/card";
import { TicketReply } from "@/components/admin/ticket-reply";
import { requireSection, isReadonly } from "@/lib/admin/rbac";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Admin · Support" };

const STATUS_STYLE: Record<string, string> = {
  open: "bg-warning/14 text-warning",
  in_progress: "bg-info/12 text-info",
  resolved: "bg-success/14 text-success",
  closed: "bg-surface-2 text-ink-3",
};
const CATEGORY_LABEL: Record<string, string> = {
  account: "Account",
  payment: "Payments",
  gig: "Gig / offer",
  trust_safety: "Trust & safety",
  bug: "Bug",
  other: "Other",
};

type Ticket = {
  id: string;
  user_id: string;
  category: string;
  subject: string;
  body: string;
  status: string;
  response: string | null;
  created_at: string;
};

async function SupportInner() {
  const { role } = await requireSection("support");
  const readonly = isReadonly(role);
  const admin = createAdminClient();

  const { data } = await admin
    .from("support_tickets")
    .select("id, user_id, category, subject, body, status, response, created_at")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(200);
  const tickets = (data ?? []) as Ticket[];

  // Attach each requester's email for context.
  const emails = new Map<string, string>();
  await Promise.all(
    [...new Set(tickets.map((t) => t.user_id))].map(async (uid) => {
      const { data: u } = await admin.auth.admin.getUserById(uid);
      if (u.user?.email) emails.set(uid, u.user.email);
    }),
  );

  const openCount = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;

  return (
    <AdminShell role={role} active="support">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Support</h1>
      <p className="mt-1 text-sm text-ink-2">
        User tickets. <span className="font-medium text-ink">{openCount}</span> open.
      </p>

      <Card className="mt-6">
        <CardBody className="p-0">
          <ul className="divide-y divide-line">
            {tickets.map((t) => (
              <li key={t.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-ink-2">{CATEGORY_LABEL[t.category] ?? t.category}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[t.status] ?? "bg-surface-2 text-ink-3"}`}>
                    {t.status.replace("_", " ")}
                  </span>
                  <span className="text-sm font-semibold text-ink">{t.subject}</span>
                </div>
                <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm text-ink-2">{t.body}</p>
                <p className="mt-1 text-xs text-ink-3">
                  {emails.get(t.user_id) ?? t.user_id.slice(0, 8)} · {new Date(t.created_at).toLocaleString()}
                </p>
                {t.response && (
                  <div className="mt-2 rounded-xl bg-surface-2 p-3 text-sm text-ink-2">
                    <span className="font-medium text-ink">Your reply:</span> {t.response}
                  </div>
                )}
                {!readonly && <TicketReply ticketId={t.id} existing={t.response} />}
              </li>
            ))}
            {tickets.length === 0 && <li className="p-6 text-center text-sm text-ink-3">No tickets yet.</li>}
          </ul>
        </CardBody>
      </Card>
    </AdminShell>
  );
}

export default function AdminSupportPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <SupportInner />
    </Suspense>
  );
}
