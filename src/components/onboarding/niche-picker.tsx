"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { CATEGORIES } from "@/lib/categories";
import { cleanNiche } from "@/lib/niches";

const PREVIEW = 14;
const MAX = 5;

export function NichePicker({ selected, onToggle }: { selected: string[]; onToggle: (niche: string) => void }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const term = query.trim().toLowerCase();
  const known = new Set(CATEGORIES.map((item) => item.toLowerCase()));
  const extras = selected.filter((item) => !known.has(item.toLowerCase()));
  const pool = term
    ? CATEGORIES.filter((item) => item.toLowerCase().includes(term))
    : expanded
      ? CATEGORIES
      : CATEGORIES.slice(0, PREVIEW);
  const hidden = term || expanded ? 0 : Math.max(0, CATEGORIES.length - PREVIEW);
  const exact = CATEGORIES.some((item) => item.toLowerCase() === term) || selected.some((item) => item.toLowerCase() === term);
  const custom = term ? cleanNiche(query) : null;
  const full = selected.length >= MAX;

  function pick(niche: string) {
    if (!selected.includes(niche) && full) return;
    onToggle(niche);
    if (!selected.includes(niche)) setQuery("");
  }

  return (
    <div className="grid gap-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search niches, or add your own"
        className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-accent"
      />
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((niche) => (
            <button key={niche} type="button" onClick={() => onToggle(niche)}>
              <Chip active>{niche}</Chip>
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {pool.filter((niche) => !selected.includes(niche)).map((niche) => (
          <button key={niche} type="button" onClick={() => pick(niche)} disabled={full}>
            <Chip>{niche}</Chip>
          </button>
        ))}
        {custom && !exact && (
          <button type="button" onClick={() => pick(custom)} disabled={full} className="inline-flex items-center gap-1 rounded-full border border-dashed border-accent px-3 py-1 text-xs font-medium text-accent disabled:opacity-40">
            <Plus className="size-3" /> Add “{custom}”
          </button>
        )}
        {!term && hidden > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-line px-3 py-1 text-xs font-medium text-ink-2 hover:border-accent hover:text-accent"
          >
            <Plus className="size-3" /> View more ({hidden})
          </button>
        )}
      </div>
      {extras.length > 0 && <p className="text-xs text-ink-3">Added by you: {extras.join(", ")}. It stays on your profile. The shared list is unchanged.</p>}
      {full && <p className="text-xs text-ink-3">Five niches is the maximum. Remove one to add another.</p>}
      {term && pool.length === 0 && !custom && <p className="text-xs text-ink-3">Use letters and a short name, between 2 and 40 characters.</p>}
    </div>
  );
}
