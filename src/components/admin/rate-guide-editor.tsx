"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CATEGORIES, NG_STATES } from "@/lib/categories";
import { ANY, type RateGuide, type RateTier } from "@/lib/rates/guides";
import { TIERS } from "@/lib/tiers";
import { saveRateGuides } from "@/app/admin/tiers/actions";

type Draft = RateGuide & { key: string };

function draft(row: RateGuide): Draft {
  return { ...row, key: `${row.tier}|${row.niche}|${row.location}|${Math.random().toString(36).slice(2, 8)}` };
}

export function RateGuideEditor({ rows, readonly }: { rows: RateGuide[]; readonly: boolean }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>(() => rows.map(draft));
  const [tier, setTier] = useState<RateTier>("origin");
  const visible = drafts.filter((row) => row.tier === tier);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update(key: string, patch: Partial<RateGuide>) {
    setSaved(false);
    setDrafts((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function save() {
    setError(null);
    start(async () => {
      const res = await saveRateGuides(drafts.map(({ tier: rowTier, niche, location, low, typical, high }) => ({ tier: rowTier, niche, location, low, typical, high })));
      if (res.error) {
        setError(res.error);
        setSaved(false);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  if (readonly) {
    return (
      <Card>
        <CardBody className="p-0">
          <ul className="divide-y divide-line">
            {rows.map((row) => (
              <li key={`${row.tier}|${row.niche}|${row.location}`} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                <span className="font-medium text-ink">{TIERS.find((item) => item.key === row.tier)?.label ?? row.tier}</span>
                <span className="font-medium text-ink">{row.niche === ANY ? "Any niche" : row.niche}</span>
                <span className="text-ink-3">{row.location === ANY ? "Everywhere" : row.location}</span>
                <span className="text-ink-2">₦{row.low.toLocaleString("en-NG")} – ₦{row.typical.toLocaleString("en-NG")} – ₦{row.high.toLocaleString("en-NG")}</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="grid gap-3">
        <div className="flex flex-wrap gap-2">
          {TIERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTier(item.key)}
              className={item.key === tier ? "rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-ink" : "rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-ink-2"}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="hidden gap-2 text-xs font-medium text-ink-3 sm:grid sm:grid-cols-[1.4fr_1fr_6rem_6rem_6rem_auto]">
          <span>Niche</span>
          <span>State</span>
          <span>Low</span>
          <span>Usual</span>
          <span>High</span>
          <span />
        </div>
        {visible.map((row) => (
          <div key={row.key} className="grid gap-2 sm:grid-cols-[1.4fr_1fr_6rem_6rem_6rem_auto] sm:items-center">
            <select
              aria-label="Niche"
              value={row.niche}
              onChange={(e) => update(row.key, { niche: e.target.value })}
              className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-ink"
            >
              <option value={ANY}>Any niche</option>
              {CATEGORIES.map((niche) => (
                <option key={niche} value={niche}>{niche}</option>
              ))}
            </select>
            <select
              aria-label="State"
              value={row.location}
              onChange={(e) => update(row.key, { location: e.target.value })}
              className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-ink"
            >
              <option value={ANY}>Everywhere</option>
              {NG_STATES.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            <Input aria-label="Low" type="number" min={1} value={row.low} onChange={(e) => update(row.key, { low: Number(e.target.value) })} />
            <Input aria-label="Usual" type="number" min={1} value={row.typical} onChange={(e) => update(row.key, { typical: Number(e.target.value) })} />
            <Input aria-label="High" type="number" min={1} value={row.high} onChange={(e) => update(row.key, { high: Number(e.target.value) })} />
            <Button type="button" variant="ghost" size="sm" aria-label="Remove band" onClick={() => setDrafts((prev) => prev.filter((item) => item.key !== row.key))}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => setDrafts((prev) => [...prev, draft({ tier, niche: ANY, location: ANY, low: 10000, typical: 12000, high: 18000 })])}>
            <Plus className="size-4" /> Add a band
          </Button>
          <Button type="button" size="sm" onClick={save} loading={pending}>Save rate bands</Button>
          {saved && <span className="text-sm text-success">Saved</span>}
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
      </CardBody>
    </Card>
  );
}
