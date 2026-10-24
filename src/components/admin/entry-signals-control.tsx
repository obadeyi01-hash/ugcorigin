"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { adminSetEntrySignals } from "@/app/admin/actions";

/**
 * Reviewer input for a creator's VERIFIED external credibility — the entry
 * head-start signals (EPS). Followers = a verified real following; prior-work
 * score = 0–100 for off-platform track record. Saving recomputes placement.
 */
export function EntrySignalsControl({
  creatorId,
  followers,
  priorWork,
  readonly,
}: {
  creatorId: string;
  followers: number;
  priorWork: number;
  readonly: boolean;
}) {
  const router = useRouter();
  const [f, setF] = useState(String(followers ?? 0));
  const [p, setP] = useState(String(priorWork ?? 0));
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (readonly) {
    return (
      <p className="text-xs text-ink-3">
        Verified followers: {followers ?? 0} · Prior-work: {priorWork ?? 0}/100
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-line pt-3">
      <label className="text-xs text-ink-2">
        Verified followers
        <input
          type="number"
          min={0}
          value={f}
          onChange={(e) => { setF(e.target.value); setSaved(false); }}
          className="mt-1 block w-32 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink"
        />
      </label>
      <label className="text-xs text-ink-2">
        Prior-work score (0–100)
        <input
          type="number"
          min={0}
          max={100}
          value={p}
          onChange={(e) => { setP(e.target.value); setSaved(false); }}
          className="mt-1 block w-32 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink"
        />
      </label>
      <Button
        size="sm"
        variant="secondary"
        loading={pending}
        onClick={() =>
          start(async () => {
            setErr(null);
            const r = await adminSetEntrySignals(creatorId, {
              verifiedFollowers: Number(f) || 0,
              priorWorkScore: Number(p) || 0,
            });
            if (r.error) setErr(r.error);
            else { setSaved(true); router.refresh(); }
          })
        }
      >
        {saved ? "Saved" : "Save credibility"}
      </Button>
      {err && <span className="text-xs text-error">{err}</span>}
    </div>
  );
}
