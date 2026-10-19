"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/input";
import { respondToTicket, setTicketStatus } from "@/app/admin/support/actions";

export function TicketReply({ ticketId, existing }: { ticketId: string; existing: string | null }) {
  const router = useRouter();
  const [reply, setReply] = useState(existing ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function send(status: "resolved" | "in_progress" | "closed") {
    setErr(null);
    start(async () => {
      const r = await respondToTicket(ticketId, reply, status);
      if (r.error) setErr(r.error);
      else router.refresh();
    });
  }

  function mark(status: "open" | "in_progress" | "resolved" | "closed") {
    start(async () => {
      const r = await setTicketStatus(ticketId, status);
      if (r.error) setErr(r.error);
      else router.refresh();
    });
  }

  const btn = "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium disabled:opacity-50";

  return (
    <div className="mt-3">
      <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply to the user (emailed to them)…" className="min-h-20" />
      {err && <p className="mt-1 text-xs text-error">{err}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button disabled={pending} onClick={() => send("resolved")} className={`${btn} border-accent/40 text-accent hover:bg-accent-tint`}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />} Reply &amp; resolve
        </button>
        <button disabled={pending} onClick={() => send("in_progress")} className={`${btn} border-line text-ink-2 hover:text-ink`}>
          Reply &amp; keep open
        </button>
        <button disabled={pending} onClick={() => mark("closed")} className={`${btn} border-line text-ink-3 hover:text-ink`}>
          Close
        </button>
      </div>
    </div>
  );
}
