"use client";

import { useState, useTransition } from "react";
import { Flag, X, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitReportAction, type ReportTarget } from "@/app/report/actions";

const REASONS = ["Spam or scam", "Fake / AI-generated", "Abusive or inappropriate", "Impersonation", "Copyright", "Other"];

export function ReportButton({
  targetType,
  targetId,
  label = "Report",
  className,
}: {
  targetType: ReportTarget;
  targetId: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function submit() {
    setErr(null);
    start(async () => {
      const r = await submitReportAction({ targetType, targetId, reason, details });
      if (r.error) setErr(r.error);
      else setDone(true);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("inline-flex items-center gap-1 text-xs font-medium text-ink-3 hover:text-ink", className)}
      >
        <Flag className="size-3.5" /> {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-obsidian/40 p-4" onClick={() => !pending && setOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">Report this</h2>
              <button onClick={() => setOpen(false)} aria-label="Close" className="text-ink-3 hover:text-ink"><X className="size-5" /></button>
            </div>

            {done ? (
              <div className="mt-4 rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-ink">
                <Check className="mb-1 size-5 text-success" />
                Thanks, our Trust &amp; Safety team will review this.
              </div>
            ) : (
              <>
                <p className="mt-1 text-sm text-ink-2">Tell us what&apos;s wrong. Reports are confidential.</p>
                <div className="mt-4 grid gap-2">
                  {REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                        reason === r ? "border-accent bg-accent-tint/50 text-ink" : "border-line text-ink-2 hover:border-line-strong",
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Add any details (optional)"
                  className="mt-3 min-h-20 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-tint"
                />
                {err && <p className="mt-2 text-sm text-error">{err}</p>}
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => setOpen(false)} className="rounded-full px-3 py-1.5 text-sm font-medium text-ink-2 hover:text-ink">Cancel</button>
                  <button
                    onClick={submit}
                    disabled={pending || !reason}
                    className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-paper disabled:opacity-50"
                  >
                    {pending && <Loader2 className="size-4 animate-spin" />} Submit report
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
