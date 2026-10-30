"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { openDisputeAction } from "@/app/gigs/trust-actions";

export function OpenDispute({ gigId }: { gigId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setErr(null);
    start(async () => {
      const res = await openDisputeAction(gigId, reason);
      if (res.error) setErr(res.error);
      else router.refresh();
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-error">
        <AlertTriangle className="size-4" /> Report a problem
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="font-semibold text-ink">Open a dispute</p>
      <p className="mt-0.5 text-sm text-ink-2">Our team reviews disputes against the written brief. Your payment stays held safely until it's resolved.</p>
      <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What went wrong?" className="mt-3 min-h-20" />
      {err && <p className="mt-2 text-sm text-error">{err}</p>}
      <div className="mt-3 flex gap-2">
        <Button variant="danger" onClick={submit} loading={pending} disabled={!reason.trim()}>Open dispute</Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}
