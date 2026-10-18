"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { cancelBoost } from "@/app/boost/actions";

export function BoostCancelButton({ boostId }: { boostId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await cancelBoost(boostId);
            if (r.error) setErr(r.error);
            else router.refresh();
          })
        }
        className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink-2 hover:border-line-strong hover:text-ink"
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />} End boost
      </button>
      {err && <span className="text-xs text-error">{err}</span>}
    </span>
  );
}
