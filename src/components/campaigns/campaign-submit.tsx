"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { submitToCampaignAction } from "@/app/campaigns/actions";

export function CampaignSubmit({ campaignId }: { campaignId: string }) {
  const [url, setUrl] = useState("");
  const [views, setViews] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [needsCreator, setNeedsCreator] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  function submit() {
    setErr(null); setNeedsCreator(false);
    start(async () => {
      const res = await submitToCampaignAction(campaignId, url, views);
      if (res?.needsCreator) setNeedsCreator(true);
      else if (res?.error) setErr(res.error);
      else if (res?.ok) setDone(true);
    });
  }

  if (done) {
    return <Card><CardBody className="text-center"><Check className="mx-auto size-6 text-success" /><p className="mt-2 font-semibold text-ink">Submitted</p><p className="mt-1 text-sm text-ink-2">Keep your view count updated, the brand pays per 1,000 verified views.</p></CardBody></Card>;
  }

  return (
    <Card>
      <CardBody>
        <h3 className="font-display font-semibold text-ink">Submit your post</h3>
        <div className="mt-3 grid gap-3">
          <Field label="Post link" hint="Your TikTok / Reel / Short / X post for this campaign.">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
          </Field>
          <Field label="Current views" hint="You can report your latest count, inflated claims get forfeited publicly.">
            <Input type="number" inputMode="numeric" value={views || ""} onChange={(e) => setViews(Number(e.target.value))} />
          </Field>
        </div>
        {needsCreator && <div className="mt-3 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-ink-2">Set up a creator profile to submit. <Link href="/onboarding?role=creator" className="font-medium text-accent hover:underline">Get started →</Link></div>}
        {err && !needsCreator && <p className="mt-2 text-sm text-error">{err}</p>}
        <Button onClick={submit} loading={pending} disabled={!url.trim()} className="mt-4">Submit</Button>
      </CardBody>
    </Card>
  );
}
