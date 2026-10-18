"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PillRow } from "@/components/ui/pill-row";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { NICHES } from "@/lib/sample-data";
import { formatNaira } from "@/lib/utils";
import { postCampaignAction } from "@/app/campaigns/actions";

export function CampaignForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [niches, setNiches] = useState<string[]>([]);
  const [pool, setPool] = useState(0);
  const [ratePer1000, setRate] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [needsBrand, setNeedsBrand] = useState(false);
  const [pending, start] = useTransition();

  function toggle(n: string) {
    setNiches((p) => (p.includes(n) ? p.filter((x) => x !== n) : p.length < 5 ? [...p, n] : p));
  }
  function submit() {
    setErr(null); setNeedsBrand(false);
    start(async () => {
      const res = await postCampaignAction({ title, description, niches, pool, ratePer1000 });
      if (res?.needsBrand) setNeedsBrand(true);
      if (res?.error) setErr(res.error);
    });
  }

  const maxPayouts = pool > 0 && ratePer1000 > 0 ? Math.floor((pool / ratePer1000) * 1000) : 0;

  return (
    <div className="grid gap-5">
      <Field label="Campaign title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Go viral with our new flavour" />
      </Field>
      <Field label="Brief" hint="What to post, the hook, hashtags, do's and don'ts.">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Post a 15 to 30s TikTok/Reel showing…" className="min-h-28" />
      </Field>
      <Field label="Niches" hint="Pick up to 5.">
        <PillRow>
          {NICHES.map((n) => (
            <button key={n} type="button" onClick={() => toggle(n)}><Chip active={niches.includes(n)}>{n}</Chip></button>
          ))}
        </PillRow>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Total pool (₦)">
          <Input type="number" inputMode="numeric" value={pool || ""} onChange={(e) => setPool(Number(e.target.value))} />
        </Field>
        <Field label="Rate per 1,000 views (₦)">
          <Input type="number" inputMode="numeric" value={ratePer1000 || ""} onChange={(e) => setRate(Number(e.target.value))} />
        </Field>
      </div>

      {maxPayouts > 0 && (
        <p className="rounded-xl border border-line bg-surface-2 p-3 text-sm text-ink-2">
          Your pool pays out up to <span className="font-semibold text-ink">{maxPayouts.toLocaleString()} views</span> at {formatNaira(ratePer1000)}/1,000.
        </p>
      )}
      {needsBrand && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-ink-2">
          You need a brand account. <Link href="/onboarding?role=brand" className="font-medium text-accent hover:underline">Set one up →</Link>
        </div>
      )}
      {err && !needsBrand && <p className="text-sm text-error">{err}</p>}

      <Button onClick={submit} loading={pending} disabled={!title.trim() || !(pool > 0) || !(ratePer1000 > 0)}>
        Create campaign <ArrowRight className="size-4" />
      </Button>
      <p className="text-xs text-ink-3">Next, fund the pool. Creators submit posts, report views, and you pay per 1,000, forfeiting any inflated claims.</p>
    </div>
  );
}
