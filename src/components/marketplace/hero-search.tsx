"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PillRow } from "@/components/ui/pill-row";

const PLATFORMS = ["All platforms", "Instagram", "TikTok", "YouTube", "X", "Twitch"];
const QUICK = [
  "Rising this week",
  "Top rated",
  "UGC",
  "Beauty & Skincare",
  "Fintech",
  "Food",
  "Under ₦50k",
];

/** Collabstr-style hero search bar. Always-light (sits on the dark hero). Entry only, routes to the directory. */
export function HeroSearch() {
  const router = useRouter();
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [q, setQ] = useState("");

  function go() {
    const params = new URLSearchParams();
    if (platform !== PLATFORMS[0]) params.set("platform", platform);
    if (q) params.set("q", q);
    router.push(`/creators${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex flex-col gap-2 rounded-[1.25rem] border border-black/5 bg-chalk p-2 shadow-xl sm:flex-row sm:items-center sm:rounded-full sm:pl-3">
        <div className="relative shrink-0">
          <label className="sr-only" htmlFor="hero-platform">
            Platform
          </label>
          <select
            id="hero-platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="h-11 w-full cursor-pointer appearance-none rounded-full bg-black/[0.04] pl-4 pr-9 text-sm font-medium text-obsidian transition-colors hover:bg-black/[0.07] focus:outline-none focus:ring-2 focus:ring-accent/40 sm:bg-transparent sm:hover:bg-black/[0.04]"
          >
            {PLATFORMS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-obsidian/50" />
        </div>

        <span className="hidden h-6 w-px bg-black/10 sm:block" />

        <div className="flex flex-1 items-center gap-2">
          <Search className="ml-1 size-4 shrink-0 text-obsidian/40 sm:ml-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go()}
            placeholder="Search by niche, skill or location…"
            className="h-11 w-full bg-transparent text-sm text-obsidian placeholder:text-obsidian/45 focus:outline-none"
          />
        </div>

        <Button onClick={go} className="shrink-0" size="md">
          Search
        </Button>
      </div>

      <PillRow className="mt-4 sm:justify-center">
        {QUICK.map((c) => (
          <button
            key={c}
            onClick={() => router.push(`/creators?q=${encodeURIComponent(c)}`)}
            className="u-press rounded-full border border-chalk/15 bg-chalk/[0.06] px-3 py-1 text-xs font-medium text-chalk/75 transition-colors hover:bg-chalk/15 hover:text-chalk"
          >
            {c}
          </button>
        ))}
      </PillRow>
    </div>
  );
}
