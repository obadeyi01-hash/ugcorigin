"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { reviewBrandVerification } from "@/app/brand-verify/actions";

export function BrandVerificationRow({ brandId, readonly }: { brandId: string; readonly: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);

  if (readonly) return null;

  function act(decision: "verified" | "unverified") {
    setErr(null);
    start(async () => {
      const r = await reviewBrandVerification(brandId, decision, note);
      if (r.error) setErr(r.error);
      else router.refresh();
    });
  }

  const btn = "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium disabled:opacity-50";

  return (
    <div className="flex flex-col items-end gap-2">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (required to reject)"
        className="h-9 w-48 rounded-full border border-line bg-surface px-3 text-xs text-ink focus:border-accent focus:outline-none"
      />
      <div className="flex gap-2">
        <button disabled={pending} onClick={() => act("verified")} className={`${btn} border-success/40 text-success hover:bg-success/5`}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Verify
        </button>
        <button disabled={pending} onClick={() => act("unverified")} className={`${btn} border-error/30 text-error hover:bg-error/5`}>
          <X className="size-3.5" /> Reject
        </button>
      </div>
      {err && <span className="text-xs text-error">{err}</span>}
    </div>
  );
}
