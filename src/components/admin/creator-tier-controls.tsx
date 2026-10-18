"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCw, Loader2 } from "lucide-react";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TIERS, type TierKey } from "@/lib/tiers";
import { adminSetTier, adminRecomputeTier } from "@/app/admin/tiers/actions";

export function CreatorTierControls({
  creatorId,
  currentTier,
  readonly,
}: {
  creatorId: string;
  currentTier: string;
  readonly: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  if (readonly) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={currentTier}
        disabled={pending}
        className="w-36"
        onChange={(e) => {
          const tier = e.target.value as TierKey;
          start(async () => {
            const r = await adminSetTier(creatorId, tier);
            setErr(r.error ?? null);
            if (!r.error) router.refresh();
          });
        }}
      >
        {TIERS.map((t) => (
          <option key={t.key} value={t.key}>
            {t.label}
          </option>
        ))}
      </Select>
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await adminRecomputeTier(creatorId);
            setErr(r.error ?? null);
            if (!r.error) router.refresh();
          })
        }
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <RotateCw className="size-4" />} Recompute
      </Button>
      {err && <span className="w-full text-xs text-error">{err}</span>}
    </div>
  );
}
