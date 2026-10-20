"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PillRow } from "@/components/ui/pill-row";
import { SocialIcon } from "@/components/ui/social-icons";
import { cn } from "@/lib/utils";

type Platform = { value: string; label: string; icon?: string };
const PLATFORMS: Platform[] = [
  { value: "", label: "All platforms" },
  { value: "instagram", label: "Instagram", icon: "instagram" },
  { value: "tiktok", label: "TikTok", icon: "tiktok" },
  { value: "youtube", label: "YouTube", icon: "youtube" },
  { value: "x", label: "X", icon: "x" },
  { value: "snapchat", label: "Snapchat", icon: "snapchat" },
];

// Typewriter prompts cycled in the search placeholder.
const PROMPTS = [
  "skincare creators in Lagos",
  "fintech testimonials",
  "food & unboxing videos",
  "fashion UGC in Abuja",
  "voice-over for my ad",
];

// Quick filters route straight to a filtered directory (like Collabstr's chips).
const QUICK: { label: string; href: string }[] = [
  { label: "Rising this week", href: "/creators?sort=recent" },
  { label: "Top rated", href: "/creators?sort=rating" },
  { label: "Beauty & Skincare", href: `/creators?niche=${encodeURIComponent("Beauty & Skincare")}` },
  { label: "Fashion", href: `/creators?niche=${encodeURIComponent("Fashion")}` },
  { label: "Fintech", href: `/creators?niche=${encodeURIComponent("Fintech")}` },
  { label: "Food", href: `/creators?niche=${encodeURIComponent("Food & Cooking")}` },
  { label: "Under ₦50k", href: "/creators?max=50000" },
];

/** Hero search bar. Always-light (sits on the dark hero). Entry only, routes to the directory. */
export function HeroSearch() {
  const router = useRouter();
  const [platform, setPlatform] = useState<Platform>(PLATFORMS[0]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [typed, setTyped] = useState("");
  const [focused, setFocused] = useState(false);
  const ddRef = useRef<HTMLDivElement>(null);

  // Typewriter effect, paused while the user is typing or focused.
  useEffect(() => {
    if (q || focused) return;
    let prompt = 0;
    let char = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const full = PROMPTS[prompt];
      if (!deleting) {
        char++;
        setTyped(full.slice(0, char));
        if (char === full.length) {
          deleting = true;
          timer = setTimeout(tick, 1600);
          return;
        }
      } else {
        char--;
        setTyped(full.slice(0, char));
        if (char === 0) {
          deleting = false;
          prompt = (prompt + 1) % PROMPTS.length;
        }
      }
      timer = setTimeout(tick, deleting ? 40 : 75);
    };
    timer = setTimeout(tick, 400);
    return () => clearTimeout(timer);
  }, [q, focused]);

  // Close the platform dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function go() {
    const params = new URLSearchParams();
    if (platform.value) params.set("platform", platform.value);
    if (q) params.set("q", q);
    router.push(`/creators${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex flex-col gap-2 rounded-[1.25rem] border border-black/5 bg-chalk p-2 shadow-xl sm:flex-row sm:items-center sm:rounded-full sm:pl-2.5">
        {/* Platform dropdown */}
        <div ref={ddRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="flex h-11 w-full items-center gap-2 rounded-full bg-black/[0.04] px-4 text-sm font-medium text-obsidian transition-colors hover:bg-black/[0.08] focus:outline-none focus:ring-2 focus:ring-accent/40 sm:bg-transparent sm:hover:bg-black/[0.05]"
          >
            {platform.icon ? <SocialIcon platform={platform.icon} className="size-4 shrink-0" /> : <Search className="size-4 shrink-0 text-obsidian/50" />}
            <span className="whitespace-nowrap">{platform.label}</span>
            <ChevronDown className={cn("size-4 text-obsidian/50 transition-transform", open && "rotate-180")} />
          </button>

          {open && (
            <div
              role="listbox"
              className="absolute left-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-2xl border border-black/10 bg-chalk p-1.5 shadow-2xl"
            >
              {PLATFORMS.map((p) => (
                <button
                  key={p.value || "all"}
                  role="option"
                  aria-selected={p.value === platform.value}
                  onClick={() => {
                    setPlatform(p);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-obsidian transition-colors hover:bg-black/[0.05]",
                    p.value === platform.value && "bg-accent-tint/60",
                  )}
                >
                  {p.icon ? <SocialIcon platform={p.icon} className="size-4 shrink-0" /> : <Search className="size-4 shrink-0 text-obsidian/50" />}
                  <span className="flex-1">{p.label}</span>
                  {p.value === platform.value && <Check className="size-4 text-accent" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="hidden h-6 w-px bg-black/10 sm:block" />

        {/* Search input with typewriter placeholder */}
        <div className="flex flex-1 items-center gap-2">
          <Search className="ml-1 size-4 shrink-0 text-obsidian/40 sm:ml-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => e.key === "Enter" && go()}
            placeholder={focused || q ? "Search by niche, skill or location…" : `Try “${typed}”`}
            aria-label="Search creators"
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
            key={c.label}
            onClick={() => router.push(c.href)}
            className="u-press rounded-full border border-chalk/15 bg-chalk/[0.06] px-3 py-1 text-xs font-medium text-chalk/75 transition-colors hover:bg-chalk/15 hover:text-chalk"
          >
            {c.label}
          </button>
        ))}
      </PillRow>
    </div>
  );
}
