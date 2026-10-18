"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { submitReviewAction } from "@/app/gigs/trust-actions";

function Stars({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-ink-2">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} star`}>
            <Star className={cn("size-5", n <= value ? "fill-accent text-accent" : "text-ink-3")} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReviewForm({ gigId, subjectLabel }: { gigId: string; subjectLabel: string }) {
  const router = useRouter();
  const [speed, setSpeed] = useState(5);
  const [comms, setComms] = useState(5);
  const [quality, setQuality] = useState(5);
  const [body, setBody] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setErr(null);
    start(async () => {
      const res = await submitReviewAction(gigId, { speed, comms, quality, body });
      if (res.error) setErr(res.error);
      else router.refresh();
    });
  }

  return (
    <Card>
      <CardBody>
        <h3 className="font-display font-semibold text-ink">Review {subjectLabel}</h3>
        <p className="mt-0.5 text-sm text-ink-2">Your honest rating builds trust for everyone.</p>
        <div className="mt-4 grid gap-3">
          <Stars value={speed} onChange={setSpeed} label="Speed" />
          <Stars value={comms} onChange={setComms} label="Communication" />
          <Stars value={quality} onChange={setQuality} label="Quality" />
        </div>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share a few words (optional)…" className="mt-4 min-h-20" />
        {err && <p className="mt-2 text-sm text-error">{err}</p>}
        <Button onClick={submit} loading={pending} className="mt-3">Submit review</Button>
      </CardBody>
    </Card>
  );
}
