"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

import { selectApplicantAction } from "@/app/briefs/actions";

export type AppRow = {
  id: string;
  pitch: string | null;
  sample_url: string | null;
  status: string;
  creatorHandle: string | null;
  creatorName: string;
};

export function ApplicationsList({ apps }: { apps: AppRow[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});
  const [, start] = useTransition();

  function select(id: string) {
    setPendingId(id);
    start(async () => {
      const res = await selectApplicantAction(id);
      setPendingId(null);
      if (res?.url) { window.location.href = res.url; return; }
      if (res?.configured === false) { setNote((n) => ({ ...n, [id]: "Selected, fund the gig in Offers (Paystack not connected yet)." })); return; }
      if (res?.error) { setNote((n) => ({ ...n, [id]: res.error! })); return; }
    });
  }

  if (apps.length === 0) {
    return <Card variant="outline"><CardBody className="py-12 text-center text-ink-2">No applications yet.</CardBody></Card>;
  }

  return (
    <div className="grid gap-3">
      {apps.map((a) => (
        <Card key={a.id}>
          <CardBody>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {a.creatorHandle ? (
                  <Link href={`/${a.creatorHandle}`} className="font-semibold text-ink hover:text-accent">{a.creatorName}</Link>
                ) : (
                  <span className="font-semibold text-ink">{a.creatorName}</span>
                )}
                {a.pitch && <p className="mt-1 text-sm text-ink-2">{a.pitch}</p>}
                {a.sample_url && <a href={a.sample_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-accent hover:underline">View sample →</a>}
              </div>
              {a.status === "selected" ? (
                <span className="shrink-0 rounded-full bg-success/12 px-2.5 py-0.5 text-xs font-medium text-success">Selected</span>
              ) : (
                <Button size="sm" loading={pendingId === a.id} onClick={() => select(a.id)}>Select &amp; fund</Button>
              )}
            </div>
            {note[a.id] && <p className="mt-2 text-xs text-warning">{note[a.id]}</p>}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
