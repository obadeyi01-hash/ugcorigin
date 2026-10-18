"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { applyToBriefAction } from "@/app/briefs/actions";

export function ApplyForm({ briefId }: { briefId: string }) {
  const [pitch, setPitch] = useState("");
  const [sampleUrl, setSampleUrl] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [needsCreator, setNeedsCreator] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  function submit() {
    setErr(null);
    setNeedsCreator(false);
    start(async () => {
      const res = await applyToBriefAction(briefId, pitch, sampleUrl);
      if (res?.needsCreator) setNeedsCreator(true);
      else if (res?.error) setErr(res.error);
      else if (res?.ok) setDone(true);
    });
  }

  if (done) {
    return (
      <Card>
        <CardBody className="text-center">
          <Check className="mx-auto size-6 text-success" />
          <p className="mt-2 font-semibold text-ink">Application sent</p>
          <p className="mt-1 text-sm text-ink-2">The brand will review and reach out if it&apos;s a match.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <h3 className="font-display font-semibold text-ink">Apply to this brief</h3>
        <div className="mt-3 grid gap-3">
          <Field label="Your pitch" hint="One or two lines on why you're a fit.">
            <Textarea value={pitch} onChange={(e) => setPitch(e.target.value)} placeholder="I make authentic skincare testimonials, here's how I'd approach this…" className="min-h-20" />
          </Field>
          <Field label="Sample link" hint="Optional, a relevant video of yours.">
            <Input value={sampleUrl} onChange={(e) => setSampleUrl(e.target.value)} placeholder="https://" />
          </Field>
        </div>
        {needsCreator && (
          <div className="mt-3 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-ink-2">
            Set up a creator profile to apply. <Link href="/onboarding?role=creator" className="font-medium text-accent hover:underline">Get started →</Link>
          </div>
        )}
        {err && !needsCreator && <p className="mt-2 text-sm text-error">{err}</p>}
        <Button onClick={submit} loading={pending} className="mt-4">Apply</Button>
      </CardBody>
    </Card>
  );
}
