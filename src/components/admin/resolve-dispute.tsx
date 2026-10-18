"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { formatNaira } from "@/lib/utils";
import { resolveDisputeAction } from "@/app/gigs/trust-actions";

export function ResolveDispute({ disputeId, price }: { disputeId: string; price: number }) {
  const router = useRouter();
  const [resolution, setResolution] = useState<"release" | "refund" | "partial">("release");
  const [amount, setAmount] = useState(Math.round(price / 2));
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function resolve() {
    setErr(null);
    start(async () => {
      const res = await resolveDisputeAction(disputeId, resolution, note, resolution === "partial" ? amount : undefined);
      if (res.error) setErr(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="mt-4 grid gap-3 border-t border-line pt-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <Select value={resolution} onChange={(e) => setResolution(e.target.value as typeof resolution)}>
          <option value="release">Release to creator ({formatNaira(price)})</option>
          <option value="refund">Refund to brand ({formatNaira(price)})</option>
          <option value="partial">Split (partial)</option>
        </Select>
        {resolution === "partial" && (
          <Input
            type="number"
            inputMode="numeric"
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="To creator (₦)"
          />
        )}
      </div>
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Resolution note (visible internally)…" className="min-h-16" />
      {err && <p className="text-sm text-error">{err}</p>}
      <Button onClick={resolve} loading={pending} className="w-fit">Resolve dispute</Button>
    </div>
  );
}
