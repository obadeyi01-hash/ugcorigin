"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PillRow } from "@/components/ui/pill-row";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { Notice } from "@/components/ui/notice";
import { NICHES } from "@/lib/sample-data";
import { postBriefAction } from "@/app/briefs/actions";

export function BriefForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [niches, setNiches] = useState<string[]>([]);
  const [budget, setBudget] = useState(0);
  const [slots, setSlots] = useState(1);
  const [deadline, setDeadline] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [href, setHref] = useState<string | null>(null);
  const [needsBrand, setNeedsBrand] = useState(false);
  const [pending, start] = useTransition();

  function toggle(n: string) {
    setNiches((p) => (p.includes(n) ? p.filter((x) => x !== n) : p.length < 5 ? [...p, n] : p));
  }

  function submit() {
    setErr(null);
    setHref(null);
    setNeedsBrand(false);
    start(async () => {
      const res = await postBriefAction({ title, description, niches, budget, deadline, slots });
      if (res?.needsBrand) setNeedsBrand(true);
      if (res?.error) {
        setErr(res.error);
        setHref(res.href ?? null);
      }
    });
  }

  return (
    <div className="grid gap-5">
      <Field label="Campaign title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 5 creators for our organic skincare line" />
      </Field>
      <Field label="Brief" hint="Format, hook angles, do's and don'ts, usage rights.">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What are you selling, and what should creators show?" className="min-h-32" />
      </Field>
      <Field label="Niches" hint="Pick up to 5.">
        <PillRow>
          {NICHES.map((n) => (
            <button key={n} type="button" onClick={() => toggle(n)}>
              <Chip active={niches.includes(n)}>{n}</Chip>
            </button>
          ))}
        </PillRow>
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Budget per creator (₦)">
          <Input type="number" inputMode="numeric" value={budget || ""} onChange={(e) => setBudget(Number(e.target.value))} />
        </Field>
        <Field label="Creators needed" hint="Up to 100 — hire at scale.">
          <Input type="number" inputMode="numeric" min={1} max={100} value={slots || ""} onChange={(e) => setSlots(Math.min(100, Math.max(1, Number(e.target.value))))} />
        </Field>
        <Field label="Deadline" hint="Optional">
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
      </div>

      {needsBrand && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-ink-2">
          You need a brand account to post. <Link href="/onboarding?role=brand" className="font-medium text-accent hover:underline">Set one up →</Link>
        </div>
      )}
      {err && !needsBrand && (
        <Notice tone="error" href={href ?? undefined} action={href ? "Verify your brand" : undefined}>{err}</Notice>
      )}

      <Button onClick={submit} loading={pending} disabled={!title.trim() || !(budget > 0)}>
        Post brief <ArrowRight className="size-4" />
      </Button>
      <p className="text-xs text-ink-3">Creators apply, you pick your favourites, and fund escrow per creator. You only pay for work you approve.</p>
    </div>
  );
}
