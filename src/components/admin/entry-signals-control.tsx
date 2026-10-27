"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { adminSetEntrySignals } from "@/app/admin/actions";
import { entryTierFromSignals } from "@/lib/tiering/entry-tier";
import { tierMeta } from "@/lib/tiers";

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
  const placement = entryTierFromSignals({ followers: Number(f) || 0, priorWork: Number(p) || 0 });
  const level = tierMeta(placement.tier).label;

  if (readonly) {
    const fixed = entryTierFromSignals({ followers, priorWork });
    return (
      <p className="text-xs text-ink-3">
        Entry level {tierMeta(fixed.tier).label} · {followers ?? 0} verified followers
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
        Off-platform work (feeds Origin, Rising or Pro)
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
      <p className="w-full text-xs text-ink-3">Places at {level}. Entry stops at Pro. Standout and above are earned from completed work.</p>
      {err && <span className="text-xs text-error">{err}</span>}
    </div>
  );
}
