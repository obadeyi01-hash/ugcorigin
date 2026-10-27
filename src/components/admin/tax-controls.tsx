"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminSetTaxRate, adminSetTransactionTax } from "@/app/admin/actions";

export function TaxRateControl({ percent, readonly }: { percent: number; readonly: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(String(percent));
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (readonly) return <p className="text-sm text-ink-2">Tax on each new charge: {percent}%</p>;

  return (
    <form
      className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault();
        setErr(null);
        start(async () => {
          const res = await adminSetTaxRate(Number(value));
          if (res.error) setErr(res.error);
          else {
            setSaved(true);
            router.refresh();
          }
        });
      }}
    >
      <label className="text-sm text-ink-2">
        Tax on each new charge (%)
        <Input type="number" min={0} max={25} step={0.1} value={value} onChange={(e) => { setValue(e.target.value); setSaved(false); }} className="mt-1 w-32" />
      </label>
      <Button size="sm" type="submit" loading={pending}>Save tax rate</Button>
      {saved && <span className="text-xs text-success">Saved. The next transaction uses this.</span>}
      {err && <span className="text-xs text-error">{err}</span>}
      <p className="w-full text-xs text-ink-3">Added on top of the creator&apos;s rate and the platform fee. Creators still keep their full rate. Each charge keeps the tax it was collected with.</p>
    </form>
  );
}

export function TransactionTaxControl({ gigId, taxNaira, readonly }: { gigId: string; taxNaira: number; readonly: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(String(taxNaira));
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  if (readonly) return null;

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setErr(null);
        start(async () => {
          const res = await adminSetTransactionTax(gigId, Number(value));
          if (res.error) setErr(res.error);
          else router.refresh();
        });
      }}
    >
      <Input type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} className="w-28" aria-label="Tax on this charge" />
      <Button size="sm" variant="secondary" type="submit" loading={pending}>Update tax</Button>
      {err && <span className="text-xs text-error">{err}</span>}
    </form>
  );
}
