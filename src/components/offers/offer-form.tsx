"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/input";
import { sendOfferAction } from "@/app/offers/actions";
import { feeFor } from "@/lib/fees";
import { formatNaira } from "@/lib/utils";

export function OfferForm({
  handle,
  creatorName,
  startingRate,
}: {
  handle: string;
  creatorName: string;
  startingRate: number;
}) {
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [price, setPrice] = useState(startingRate || 0);
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsBrand, setNeedsBrand] = useState(false);
  const [pending, start] = useTransition();

  const fee = feeFor(price || 0);
  const total = (price || 0) + fee;

  function submit() {
    setError(null);
    setNeedsBrand(false);
    start(async () => {
      const res = await sendOfferAction({ handle, title, brief, price, deadline });
      if (res?.needsBrand) setNeedsBrand(true);
      if (res?.error) setError(res.error);
      // success redirects server-side
    });
  }

  return (
    <div className="grid gap-5">
      <Field label="Title" hint="A short name for this project.">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 3 skincare testimonial videos" />
      </Field>
      <Field label="Brief" hint="What are you selling, and what should the creator show?">
        <Textarea value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Format, hook angles, do's and don'ts, usage rights…" className="min-h-32" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Budget (₦)" hint="The creator keeps 100% of this.">
          <Input type="number" inputMode="numeric" value={price || ""} onChange={(e) => setPrice(Number(e.target.value))} />
        </Field>
        <Field label="Deadline" hint="Optional">
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
      </div>

      <div className="rounded-xl border border-line bg-surface-2 p-4 text-sm">
        <div className="flex justify-between text-ink-2"><span>Creator rate</span><span>{formatNaira(price || 0)}</span></div>
        <div className="mt-1 flex justify-between text-ink-2"><span>Platform fee (12%)</span><span>{formatNaira(fee)}</span></div>
        <div className="mt-2 flex justify-between border-t border-line pt-2 font-semibold text-ink"><span>You pay (held in escrow)</span><span>{formatNaira(total)}</span></div>
      </div>

      {needsBrand && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-ink-2">
          You need a brand account to hire.{" "}
          <Link href="/onboarding?role=brand" className="font-medium text-accent hover:underline">Set one up →</Link>
        </div>
      )}
      {error && !needsBrand && <p className="text-sm text-error">{error}</p>}

      <Button onClick={submit} loading={pending} disabled={!title.trim() || !(price > 0)}>
        Send offer to {creatorName} <ArrowRight className="size-4" />
      </Button>
      <p className="text-xs text-ink-3">
        We hold your payment in escrow after the creator accepts. You only pay for good work, release funds when you approve.
      </p>
    </div>
  );
}
