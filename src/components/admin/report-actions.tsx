"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Ban, Trash2, XCircle, Check, AlertTriangle } from "lucide-react";
import { dismissReport, takedownProfile, removeReview, removeSubmission, issueStrike } from "@/app/admin/moderation/actions";

type TargetType = "profile" | "review" | "campaign_submission" | "deliverable";

export function ReportActions({ reportId, targetType, targetId }: { reportId: string; targetType: TargetType; targetId?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function run(fn: () => Promise<{ error?: string }>) {
    setErr(null);
    start(async () => {
      const r = await fn();
      if (r.error) setErr(r.error);
      else router.refresh();
    });
  }

  const btn = "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {targetType === "profile" && targetId && (
        <button disabled={pending} onClick={() => run(() => issueStrike(targetId, "Issued from a moderation report."))} className={`${btn} border-warning/40 text-warning hover:bg-warning/5`}>
          <AlertTriangle className="size-3.5" /> Issue strike
        </button>
      )}
      {targetType === "profile" && (
        <button disabled={pending} onClick={() => run(() => takedownProfile(reportId))} className={`${btn} border-error/30 text-error hover:bg-error/5`}>
          <Ban className="size-3.5" /> Take profile offline
        </button>
      )}
      {targetType === "review" && (
        <button disabled={pending} onClick={() => run(() => removeReview(reportId))} className={`${btn} border-error/30 text-error hover:bg-error/5`}>
          <Trash2 className="size-3.5" /> Remove review
        </button>
      )}
      {targetType === "campaign_submission" && (
        <button disabled={pending} onClick={() => run(() => removeSubmission(reportId))} className={`${btn} border-error/30 text-error hover:bg-error/5`}>
          <XCircle className="size-3.5" /> Forfeit submission
        </button>
      )}
      <button disabled={pending} onClick={() => run(() => dismissReport(reportId, ""))} className={`${btn} border-line text-ink-2 hover:text-ink`}>
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Dismiss
      </button>
      {err && <span className="text-xs text-error">{err}</span>}
    </div>
  );
}
