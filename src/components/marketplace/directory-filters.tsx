"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Select } from "@/components/ui/input";
import { PillRow } from "@/components/ui/pill-row";
import { CATEGORIES, REGIONS, PLATFORM_FILTERS, BUDGET_FILTERS, SORT_FILTERS } from "@/lib/categories";

export function DirectoryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") ?? "");
  const niche = params.get("niche") ?? "";
  const region = params.get("region") ?? "";
  const max = params.get("max") ?? "";
  const platform = params.get("platform") ?? "";
  const sort = params.get("sort") ?? "";

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

  const hasFilters = q || niche || region || max || platform || sort;

  return (
    <div className="space-y-3">
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
        <Select value={niche} onChange={(e) => push({ niche: e.target.value })} className="sm:w-56">
          <option value="">All services</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
      </div>

      <PillRow className="gap-2">
        <Select value={region} onChange={(e) => push({ region: e.target.value })} className="w-40">
          <option value="">All regions</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </Select>
        <Select value={max} onChange={(e) => push({ max: e.target.value })} className="w-40">
          {BUDGET_FILTERS.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </Select>
        <Select value={platform} onChange={(e) => push({ platform: e.target.value })} className="w-40">
          <option value="">All platforms</option>
          {PLATFORM_FILTERS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </Select>
        <Select value={sort} onChange={(e) => push({ sort: e.target.value })} className="w-44">
          {SORT_FILTERS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>
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
