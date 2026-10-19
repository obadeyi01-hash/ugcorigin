"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startSubscription } from "@/app/pro/actions";

export function SubscribeButton({ active }: { active: boolean }) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState<string | null>(null);

  if (active) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/5 p-4 text-sm font-medium text-ink">
        You&rsquo;re on Creator Pro. Thanks for the support.
      </div>
    );
  }

  function go() {
    setNote(null);
    start(async () => {
      const r = await startSubscription();
      if (r.url) { window.location.href = r.url; return; }
      if (r.configured === false) { setNote("Payments aren't connected yet."); return; }
      if (r.error) setNote(r.error);
    });
  }

  return (
    <div>
      <Button onClick={go} loading={pending} size="lg">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Go Pro
      </Button>
      {note && <p className="mt-2 text-sm text-warning">{note}</p>}
    </div>
  );
}
