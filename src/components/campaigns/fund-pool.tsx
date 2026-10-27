"use client";

import { useState, useTransition } from "react";
import { Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fundCampaignAction } from "@/app/campaigns/actions";

export function FundPool({ campaignId, note: chargeNote }: { campaignId: string; note?: string }) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState<string | null>(null);
  return (
    <div className="grid gap-1.5">
      <Button
        loading={pending}
        onClick={() =>
          start(async () => {
            const r = await fundCampaignAction(campaignId);
            if (r.url) { window.location.href = r.url; return; }
            if (r.configured === false) setNote("Payments aren't connected yet (add your Paystack key).");
            else if (r.error) setNote(r.error);
          })
        }
      >
        <Banknote className="size-4" /> Fund the pool
      </Button>
      {chargeNote && <p className="text-xs text-ink-3">{chargeNote}</p>}
      {note && <p className="text-xs text-warning">{note}</p>}
    </div>
  );
}
