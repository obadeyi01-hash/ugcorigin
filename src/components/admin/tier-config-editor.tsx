"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";
import { adminUpdateTierConfig } from "@/app/admin/tiers/actions";
import type { TierKey } from "@/lib/tiers";

type Row = { tier: string; rank: number; label: string; tagline: string; floor_naira: number };

export function TierConfigEditor({ rows, readonly }: { rows: Row[]; readonly: boolean }) {
  return (
    <Card>
      <CardBody className="p-0">
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <TierRow key={r.tier} row={r} readonly={readonly} />
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

function TierRow({ row, readonly }: { row: Row; readonly: boolean }) {
  const router = useRouter();
  const [label, setLabel] = useState(row.label);
  const [tagline, setTagline] = useState(row.tagline);
  const [floor, setFloor] = useState(String(row.floor_naira));
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const dirty = label !== row.label || tagline !== row.tagline || Number(floor) !== row.floor_naira;

  if (readonly) {
    return (
      <li className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="font-medium text-ink">
            {row.rank}. {row.label}
          </p>
          <p className="text-xs text-ink-3">{row.tagline}</p>
        </div>
        <span className="shrink-0 text-sm font-medium text-ink-2">{formatNaira(row.floor_naira)}</span>
      </li>
    );
  }

  return (
    <li className="p-4">
      <div className="grid gap-2 sm:grid-cols-[1.5rem_1fr_1.6fr_7.5rem_auto] sm:items-center">
        <span className="hidden text-sm font-semibold text-ink-3 sm:block">{row.rank}</span>
        <Input aria-label="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
        <Input aria-label="Tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
        <Input aria-label="Floor (₦)" type="number" min={0} value={floor} onChange={(e) => setFloor(e.target.value)} />
        <Button
          size="sm"
          disabled={pending || !dirty}
          onClick={() =>
            start(async () => {
              const r = await adminUpdateTierConfig(row.tier as TierKey, {
                floor_naira: Number(floor) || 0,
                label,
                tagline,
              });
              setStatus(r.error ? "error" : "saved");
              if (!r.error) router.refresh();
              setTimeout(() => setStatus("idle"), 2000);
            })
          }
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : status === "saved" ? <Check className="size-4" /> : null} Save
        </Button>
      </div>
      {status === "error" && <p className="mt-1 text-xs text-error">Couldn’t save, check your access.</p>}
    </li>
  );
}
