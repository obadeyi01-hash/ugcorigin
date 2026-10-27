"use client";

import { useEffect, useState } from "react";
import { suggestStartingRate } from "@/app/rates/actions";
import { rateMessage, type RateSuggestion } from "@/lib/rates/guides";
import { formatNaira } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function RateNudge({
  niches,
  location,
  rate,
  tier = "origin",
  onUse,
  onTypical,
}: {
  niches: string[];
  location: string;
  rate: number;
  tier?: string;
  onUse?: (amount: number) => void;
  onTypical?: (amount: number) => void;
}) {
  const [suggestion, setSuggestion] = useState<RateSuggestion | null>(null);
  const key = `${tier}|${location}|${niches.join("|")}`;

  useEffect(() => {
    let live = true;
    suggestStartingRate(niches, location, tier).then((next) => {
      if (!live || !next) return;
      setSuggestion(next);
      onTypical?.(next.typical);
    });
    return () => {
      live = false;
    };
    // niches is represented by `key` so a new array identity does not refetch on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!suggestion) return null;
  const message = rateMessage(rate, suggestion);
  const showUse = !!onUse && message.stance !== "ok";

  return (
    <div className={message.stance === "high" || message.stance === "low" ? "rounded-xl bg-warning/10 px-3 py-3" : "rounded-xl bg-surface-2 px-3 py-3"}>
      <p className="text-sm text-ink-2">{message.lead}</p>
      {message.detail && <p className="mt-1 text-xs text-ink-3">{message.detail}</p>}
      {showUse && (
        <Button type="button" size="sm" variant="secondary" className="mt-3" onClick={() => onUse(suggestion.typical)}>
          Use {formatNaira(suggestion.typical)}
        </Button>
      )}
    </div>
  );
}
