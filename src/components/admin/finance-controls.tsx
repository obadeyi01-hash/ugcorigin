"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { adminReleaseEscrow, adminRefundEscrow, adminMarkPayoutPaid, adminRetryPayout, adminApproveRelease, adminRejectRelease } from "@/app/admin/actions";

export function EscrowControls({ gigId, readonly }: { gigId: string; readonly: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  if (readonly) return <span className="text-xs text-ink-3">Read-only</span>;

  function run(fn: () => Promise<{ error?: string; pendingApproval?: boolean }>) {
    setErr(null);
    start(async () => {
      const r = await fn();
      if (r.error) setErr(r.error);
      else if (r.pendingApproval) {
        // Large amount — money didn't move; a second admin must approve.
        setSubmitted(true);
        router.refresh();
      } else router.refresh();
    });
  }

  if (submitted) return <span className="text-xs font-medium text-accent">Submitted for approval ✓</span>;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Button size="sm" loading={pending} onClick={() => run(() => adminReleaseEscrow(gigId))}>Release</Button>
        <Button size="sm" variant="secondary" loading={pending} onClick={() => run(() => adminRefundEscrow(gigId))}>Refund</Button>
      </div>
      {err && <span className="text-xs text-error">{err}</span>}
    </div>
  );
}

/**
 * Second-admin decision on a pending dual-control request. The initiator can't
 * approve their own request, so when the viewer IS the requester we show the Approve
 * button disabled with a note and leave only Cancel (reject) available.
 */
export function ReleaseApprovalControls({
  approvalId,
  isRequester,
  readonly,
}: {
  approvalId: string;
  isRequester: boolean;
  readonly: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  if (readonly) return <span className="text-xs text-ink-3">Read-only</span>;

  function run(fn: () => Promise<{ error?: string }>) {
    setErr(null);
    start(async () => {
      const r = await fn();
      if (r.error) setErr(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          loading={pending}
          disabled={isRequester}
          title={isRequester ? "You filed this request, another admin must approve." : undefined}
          onClick={() => run(() => adminApproveRelease(approvalId))}
        >
          Approve
        </Button>
        <Button size="sm" variant="secondary" loading={pending} onClick={() => run(() => adminRejectRelease(approvalId))}>
          {isRequester ? "Cancel" : "Reject"}
        </Button>
      </div>
      {isRequester && <span className="text-xs text-ink-3">You requested this, another admin must approve.</span>}
      {err && <span className="text-xs text-error">{err}</span>}
    </div>
  );
}

export function PayoutControls({ payoutId, readonly }: { payoutId: string; readonly: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  if (readonly) return <span className="text-xs text-ink-3">Read-only</span>;
  return (
    <Button size="sm" variant="secondary" loading={pending} onClick={() => start(async () => { await adminMarkPayoutPaid(payoutId); router.refresh(); })}>
      Mark paid
    </Button>
  );
}

/** For payouts that failed/reversed — re-attempt the Paystack transfer. */
export function RetryPayoutControls({ payoutId, readonly }: { payoutId: string; readonly: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  if (readonly) return <span className="text-xs text-ink-3">Read-only</span>;
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Button
          size="sm"
          loading={pending}
          onClick={() =>
            start(async () => {
              setErr(null);
              const r = await adminRetryPayout(payoutId);
              if (r.error) setErr(r.error);
              else router.refresh();
            })
          }
        >
          Retry payout
        </Button>
        <Button size="sm" variant="secondary" loading={pending} onClick={() => start(async () => { await adminMarkPayoutPaid(payoutId); router.refresh(); })}>
          Mark paid
        </Button>
      </div>
      {err && <span className="text-xs text-error">{err}</span>}
    </div>
  );
}
