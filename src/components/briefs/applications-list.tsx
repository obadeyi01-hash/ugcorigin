"use client";
import { track } from "@/components/analytics/track";

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
  /** Public profile facts. Phone and social handles are not on this card. */
  location?: string | null;
  niches?: string[];
  messageHref?: string | null;
  gigHref?: string | null;
};

export function ApplicationsList({
  apps,
  inHouse = false,
  canAct = true,
}: {
  apps: AppRow[];
  /** Accepting starts the job and the conversation. No payment is taken. */
  inHouse?: boolean;
  /** The hiring brand can accept. An admin looking in cannot act as the brand. */
  canAct?: boolean;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});
  const [, start] = useTransition();

  function select(id: string) {
    setPendingId(id);
    start(async () => {
      const res = await selectApplicantAction(id);
      setPendingId(null);
      if (res?.href) {
        window.location.href = res.href;
        return;
      }
      if (res?.url) {
        track("InitiateCheckout", { content_name: "gig_funding" });
        window.location.href = res.url;
        return;
      }
      if (res?.configured === false) {
        setNote((n) => ({ ...n, [id]: "Selected. Fund the gig in Offers." }));
        return;
      }
      if (res?.error) {
        setNote((n) => ({ ...n, [id]: res.error! }));
        return;
      }
      setNote((n) => ({ ...n, [id]: "Selected." }));
    });
  }

  if (apps.length === 0) {
    return (
      <Card variant="outline">
        <CardBody className="py-12 text-center text-ink-2">No applications yet.</CardBody>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {inHouse && canAct && (
        <p className="text-sm text-ink-2">
          In-house brief. You see the pitch, sample, location and niches now. Accepting starts the job and opens the conversation, and the fuller profile opens with it. No payment is taken.
        </p>
      )}
      {apps.map((a) => {
        const facts = [a.location, ...(a.niches ?? []).slice(0, 3)].filter(Boolean).join(" · ");
        return (
          <Card key={a.id}>
            <CardBody>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {a.creatorHandle ? (
                    <Link href={`/${a.creatorHandle}`} className="font-semibold text-ink hover:text-accent">
                      {a.creatorName}
                    </Link>
                  ) : (
                    <span className="font-semibold text-ink">{a.creatorName}</span>
                  )}
                  {a.creatorHandle && <p className="text-xs text-ink-3">@{a.creatorHandle}</p>}
                  {facts && <p className="mt-1 text-xs text-ink-3">{facts}</p>}
                  {a.pitch && <p className="mt-1 text-sm text-ink-2">{a.pitch}</p>}
                  {a.sample_url && (
                    <a href={a.sample_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-accent hover:underline">
                      View sample
                    </a>
                  )}
                  {a.status === "selected" && (a.messageHref || a.gigHref) && (
                    <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                      {a.messageHref && (
                        <Link href={a.messageHref} className="font-medium text-accent hover:underline">
                          Open conversation
                        </Link>
                      )}
                      {a.gigHref && (
                        <Link href={a.gigHref} className="font-medium text-accent hover:underline">
                          View the job
                        </Link>
                      )}
                    </p>
                  )}
                </div>
                {a.status === "selected" ? (
                  <span className="shrink-0 rounded-full bg-success/12 px-2.5 py-0.5 text-xs font-medium text-success">Accepted</span>
                ) : canAct ? (
                  <Button size="sm" loading={pendingId === a.id} onClick={() => select(a.id)}>
                    {inHouse ? "Accept and message" : "Select & fund"}
                  </Button>
                ) : (
                  <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium capitalize text-ink-2">{a.status}</span>
                )}
              </div>
              {note[a.id] && <p className="mt-2 text-xs text-warning">{note[a.id]}</p>}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
