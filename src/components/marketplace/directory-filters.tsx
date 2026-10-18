"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { Select } from "@/components/ui/input";
import { PillRow } from "@/components/ui/pill-row";
import { NICHES } from "@/lib/sample-data";

const PRICE_OPTIONS = [
  { label: "Any price", value: "" },
  { label: "Under ₦50k", value: "50000" },
  { label: "Under ₦100k", value: "100000" },
  { label: "Under ₦200k", value: "200000" },
];

export function DirectoryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") ?? "");
  const niche = params.get("niche") ?? "";
  const max = params.get("max") ?? "";

  // keep the input in sync if the URL changes elsewhere
  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  function push(next: Record<string, string>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    router.push(`${pathname}?${sp.toString()}`);
  }

  const hasFilters = q || niche || max;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            push({ q });
          }}
          className="relative flex-1"
        >
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or location…"
            className="h-11 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-tint"
          />
        </form>
        <Select
          value={max}
          onChange={(e) => push({ max: e.target.value })}
          className="sm:w-44"
        >
          {PRICE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </div>

      <PillRow>
        <button onClick={() => push({ niche: "" })}>
          <Chip active={!niche}>All</Chip>
        </button>
        {NICHES.map((n) => (
          <button key={n} onClick={() => push({ niche: niche === n ? "" : n })}>
            <Chip active={niche === n}>{n}</Chip>
          </button>
        ))}
        {hasFilters && (
          <button
            onClick={() => router.push(pathname)}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-ink-3 hover:text-ink"
          >
            <X className="size-3" /> Clear
          </button>
        )}
      </PillRow>
    </div>
  );
}
