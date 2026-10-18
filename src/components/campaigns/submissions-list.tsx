"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { cn, formatNaira } from "@/lib/utils";
import { ReportButton } from "@/components/moderation/report-button";
import { approveAndPayAction, forfeitSubmissionAction } from "@/app/campaigns/actions";

export type Submission = {
  id: string;
  creatorName: string;
  creatorHandle: string | null;
  url: string;
  claimed_views: number;
  approved_views: number;
  payout_naira: number;
  status: string;
  forfeit_reason: string | null;
};

const BADGE: Record<string, string> = {
  submitted: "bg-info/12 text-info",
  approved: "bg-success/12 text-success",
  paid: "bg-success/12 text-success",
  forfeited: "bg-error/12 text-error",
};

export function SubmissionsList({ submissions, isOwner, open }: { submissions: Submission[]; isOwner: boolean; open: boolean }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [views, setViews] = useState<Record<string, number>>({});
  const [note, setNote] = useState<Record<string, string>>({});
  const [, start] = useTransition();

  function run(id: string, fn: () => Promise<{ error?: string }>) {
    setPendingId(id);
    start(async () => {
      const r = await fn();
      setPendingId(null);
      if (r.error) setNote((n) => ({ ...n, [id]: r.error! }));
      else router.refresh();
    });
  }

  if (submissions.length === 0) {
    return <Card variant="outline"><CardBody className="py-12 text-center text-ink-2">No submissions yet.</CardBody></Card>;
  }

  return (
    <div className="grid gap-3">
      {submissions.map((s) => (
        <Card key={s.id}>
          <CardBody>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                {s.creatorHandle ? (
                  <Link href={`/${s.creatorHandle}`} className="font-semibold text-ink hover:text-accent">{s.creatorName}</Link>
                ) : (
                  <span className="font-semibold text-ink">{s.creatorName}</span>
                )}
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="mt-0.5 flex items-center gap-1 truncate text-xs text-accent hover:underline">
                  <ExternalLink className="size-3" /> {s.url}
                </a>
                <p className="mt-1 text-sm text-ink-2">
                  <span className="font-medium text-ink">{s.claimed_views.toLocaleString()}</span> claimed views
                  {s.status === "paid" && <> · approved {s.approved_views.toLocaleString()} · paid {formatNaira(s.payout_naira)}</>}
                </p>
                {s.status === "forfeited" && s.forfeit_reason && <p className="mt-1 text-xs text-error">Forfeited: {s.forfeit_reason}</p>}
              </div>
              <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", BADGE[s.status] ?? "bg-surface-2 text-ink-2")}>{s.status}</span>
            </div>

            {isOwner && open && s.status === "submitted" && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                <Input
                  type="number"
                  inputMode="numeric"
                  className="w-40"
                  placeholder="Approved views"
                  value={views[s.id] ?? s.claimed_views}
                  onChange={(e) => setViews((v) => ({ ...v, [s.id]: Number(e.target.value) }))}
                />
                <Button size="sm" loading={pendingId === s.id} onClick={() => run(s.id, () => approveAndPayAction(s.id, views[s.id] ?? s.claimed_views))}>Approve &amp; pay</Button>
                <Button size="sm" variant="secondary" loading={pendingId === s.id} onClick={() => run(s.id, () => forfeitSubmissionAction(s.id, ""))}>Forfeit</Button>
              </div>
            )}
            {note[s.id] && <p className="mt-2 text-xs text-error">{note[s.id]}</p>}
            <div className="mt-3 flex justify-end border-t border-line pt-2">
              <ReportButton targetType="campaign_submission" targetId={s.id} label="Report submission" />
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
