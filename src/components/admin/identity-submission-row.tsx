"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminApproveIdentity, adminRejectIdentity } from "@/app/admin/actions";

export function IdentitySubmissionRow({
  creatorId,
  readonly,
}: {
  creatorId: string;
  readonly: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);

  if (readonly) return <span className="text-xs text-ink-3">Read-only</span>;

  function approve() {
    setErr(null);
    start(async () => {
      const res = await adminApproveIdentity(creatorId);
      if (res.error) setErr(res.error);
      else router.refresh();
    });
  }
  function reject() {
    setErr(null);
    start(async () => {
      const res = await adminRejectIdentity(creatorId, reason);
      if (res.error) setErr(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="grid gap-2">
      {!rejecting ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" loading={pending} onClick={approve}>
            <Check className="size-4" /> Approve &amp; go live
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => setRejecting(true)}>
            <X className="size-4" /> Reject
          </Button>
        </div>
      ) : (
        <div className="grid gap-2">
          <Input
            placeholder="Reason (shown to the creator)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" loading={pending} disabled={!reason.trim()} onClick={reject}>
              Confirm reject
            </Button>
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => { setRejecting(false); setReason(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      {err && <p className="text-xs text-error">{err}</p>}
    </div>
  );
}
