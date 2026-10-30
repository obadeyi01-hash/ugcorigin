import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminContentSkeleton } from "@/components/ui/skeleton";
import { Card, CardBody } from "@/components/ui/card";
import { TicketReply } from "@/components/admin/ticket-reply";
import { AdminListControls } from "@/components/admin/list-controls";
import { requireSection, isReadonly } from "@/lib/admin/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import { pageCount, pageWindow, readPage, readQuery } from "@/lib/admin/list";

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

const TICKET_STATUS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

async function SupportInner({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { role } = await requireSection("support");
  const readonly = isReadonly(role);
  const admin = createAdminClient();
  const sp = await searchParams;
  const q = readQuery(sp.q);
  const status = TICKET_STATUS.some((item) => item.value === sp.status) ? sp.status! : "all";
  const page = readPage(sp.page);
  const window = pageWindow(page);

  let query = admin
    .from("support_tickets")
    .select("id, user_id, category, subject, body, status, response, created_at", { count: "exact" })
    .order("created_at", { ascending: false });
  if (q) query = query.ilike("subject", `%${q}%`);
  if (status !== "all") query = query.eq("status", status);
  const [{ data, count }, { count: openCount }] = await Promise.all([
    query.range(window.from, window.to),
    admin.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
  ]);
  const pages = pageCount(count);
  const tickets = (data ?? []) as Ticket[];
  const pagesSafe = pages;

  // Attach each requester's email for context.
  const emails = new Map<string, string>();
  await Promise.all(
    [...new Set(tickets.map((t) => t.user_id))].map(async (uid) => {
      const { data: u } = await admin.auth.admin.getUserById(uid);
      if (u.user?.email) emails.set(uid, u.user.email);
    }),
  );

  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Support</h1>
      <p className="mt-1 text-sm text-ink-2">
        User tickets. <span className="font-medium text-ink">{openCount ?? 0}</span> open.
      </p>
      <AdminListControls
        pathname="/admin/support"
        q={q}
        placeholder="Subject"
        filters={[{ name: "status", label: "Status", value: status, options: TICKET_STATUS }]}
        page={Math.min(page, pagesSafe)}
        pages={pagesSafe}
        total={count ?? 0}
      />

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
    </>
  );
}

export default function AdminSupportPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return (
    <Suspense fallback={<AdminContentSkeleton />}>
      <SupportInner searchParams={searchParams} />
    </Suspense>
  );
}
