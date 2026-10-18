"use client";

import { useState, useTransition } from "react";
import { Rocket, Loader2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatNaira } from "@/lib/utils";
import { boostPackages, BOOST_TARGET_LABEL, type BoostTargetType } from "@/lib/boosts";
import { createBoostCheckout } from "@/app/boost/actions";

export function BoostButton({
  targetType,
  targetId,
  label,
  variant = "secondary",
  size = "sm",
}: {
  targetType: BoostTargetType;
  targetId: string;
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
}) {
  const packages = boostPackages(targetType);
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(packages[1]?.days ?? packages[0].days);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const noun = BOOST_TARGET_LABEL[targetType];

  function go() {
    setMsg(null);
    start(async () => {
      const r = await createBoostCheckout({ targetType, targetId, days });
      if (r.url) {
        window.location.href = r.url;
        return;
      }
      if (r.configured === false) {
        setMsg("Payments aren’t connected yet, boosts open once Paystack is live.");
        return;
      }
      setMsg(r.error ?? "Could not start the boost.");
    });
  }

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        <Rocket className="size-4" /> {label ?? "Boost"}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-obsidian/40 p-4"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-line p-5">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">Feature your {noun}</h2>
                <p className="mt-0.5 text-sm text-ink-2">
                  A spot in the labelled <span className="font-medium text-ink">Featured</span> band for a set time.
                </p>
              </div>
              <button onClick={() => setOpen(false)} disabled={pending} aria-label="Close" className="text-ink-3 hover:text-ink">
                <X className="size-5" />
              </button>
            </div>

            <div className="p-5">
              <div className="grid gap-2">
                {packages.map((p) => (
                  <button
                    key={p.days}
                    type="button"
                    onClick={() => setDays(p.days)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors",
                      days === p.days ? "border-accent bg-accent-tint/50" : "border-line hover:border-line-strong",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "grid size-4 place-items-center rounded-full border",
                          days === p.days ? "border-accent bg-accent text-accent-ink" : "border-line",
                        )}
                      >
                        {days === p.days && <Check className="size-3" />}
                      </span>
                      <span className="text-sm font-medium text-ink">{p.label}</span>
                    </span>
                    <span className="font-display font-semibold text-ink">{formatNaira(p.priceNaira)}</span>
                  </button>
                ))}
              </div>

              <p className="mt-3 text-xs text-ink-3">
                Boosts add a capped Featured band only, they never change your ranking, tier or reviews, and never take a
                newcomer’s exploration slot.
              </p>

              {msg && <p className="mt-3 rounded-lg bg-warning/12 px-3 py-2 text-sm text-warning">{msg}</p>}

              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>
                  Cancel
                </Button>
                <Button size="sm" onClick={go} disabled={pending}>
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  Pay {formatNaira(boostPackages(targetType).find((p) => p.days === days)?.priceNaira ?? 0)}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
