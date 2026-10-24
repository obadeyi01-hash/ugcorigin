"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { adminReleaseEscrow, adminRefundEscrow, adminMarkPayoutPaid, adminRetryPayout } from "@/app/admin/actions";

export function EscrowControls({ gigId, readonly }: { gigId: string; readonly: boolean }) {
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
      <div className="flex gap-2">
        <Button size="sm" loading={pending} onClick={() => run(() => adminReleaseEscrow(gigId))}>Release</Button>
        <Button size="sm" variant="secondary" loading={pending} onClick={() => run(() => adminRefundEscrow(gigId))}>Refund</Button>
      </div>
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
