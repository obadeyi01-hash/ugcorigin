"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminApproveIdentity, adminRejectIdentity } from "@/app/admin/actions";
import { TIERS, type TierKey } from "@/lib/tiers";
import { formatNaira } from "@/lib/utils";

const ENTRY = TIERS.filter((tier) => tier.key === "origin" || tier.key === "rising" || tier.key === "pro");

export function IdentitySubmissionRow({
  creatorId,
  readonly,
  tier,
  rate,
  typicals,
  summary,
}: {
  creatorId: string;
  readonly: boolean;
  tier: TierKey;
  rate: number;
  typicals: { origin: number; rising: number; pro: number };
  summary: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [level, setLevel] = useState<TierKey>(tier);
  const [startingRate, setStartingRate] = useState(String(rate || ""));
  const [err, setErr] = useState<string | null>(null);

  if (readonly) return <span className="text-xs text-ink-3">Read-only</span>;

  function approve() {
    setErr(null);
    start(async () => {
      const res = await adminApproveIdentity(creatorId, { tier: level, startingRate: Number(startingRate) });
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
      <p className="max-w-xs text-xs text-ink-3">{summary}. They get a note about this level and how to present the work.</p>
      <label className="text-xs text-ink-2">
        Level
        <select
          value={level}
          onChange={(e) => {
            const next = e.target.value as TierKey;
            setLevel(next);
            if (next === "origin" || next === "rising" || next === "pro") setStartingRate(String(typicals[next]));
          }}
          className="mt-1 block w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink"
        >
          {ENTRY.map((item) => (
            <option key={item.key} value={item.key}>{item.label}</option>
          ))}
        </select>
      </label>
      <label className="text-xs text-ink-2">
        Starting rate (₦)
        <Input type="number" min={0} value={startingRate} onChange={(e) => setStartingRate(e.target.value)} />
        <span className="mt-1 block text-ink-3">Usual for this level {formatNaira(level === "rising" || level === "pro" ? typicals[level] : typicals.origin)}</span>
      </label>
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
