"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/utils";
import { feeFor } from "@/lib/fees";
import { acceptOfferAction, declineOfferAction, fundOfferAction } from "@/app/offers/actions";
import { BrandSnapshot, type BrandMetrics } from "@/components/marketplace/brand-snapshot";

export type OfferRow = {
  id: string;
  title: string;
  brief: string | null;
  price_naira: number;
  deadline: string | null;
  status: string;
  role: "creator" | "brand";
  counterparty: string;
  brandMetrics?: BrandMetrics;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning/14 text-warning",
  accepted: "bg-info/12 text-info",
  declined: "bg-error/12 text-error",
  withdrawn: "bg-surface-2 text-ink-3",
};

export function OfferList({ offers }: { offers: OfferRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});
  const [, start] = useTransition();

  function run(id: string, fn: () => Promise<{ error?: string; url?: string; configured?: boolean }>) {
    setPendingId(id);
    start(async () => {
      const res = await fn();
      setPendingId(null);
      if (res?.url) { window.location.href = res.url; return; }
      if (res?.configured === false) { setNote((n) => ({ ...n, [id]: "Payments aren't connected yet (add your Paystack key)." })); return; }
      if (res?.error) { setNote((n) => ({ ...n, [id]: res.error! })); return; }
      router.refresh();
    });
  }

  if (offers.length === 0) {
    return (
      <Card variant="outline">
        <CardBody className="py-14 text-center">
          <p className="text-ink-2">No offers yet.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {offers.map((o) => {
        const busy = pendingId === o.id;
        return (
          <Card key={o.id}>
            <CardBody>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-ink">{o.title}</h3>
                  <p className="text-xs text-ink-3">
                    {o.role === "creator" ? "From" : "To"} {o.counterparty}
                    {o.deadline ? ` · due ${o.deadline}` : ""}
                  </p>
                </div>
                <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", STATUS_STYLES[o.status] ?? "bg-surface-2 text-ink-3")}>
                  {o.status}
                </span>
              </div>

              {o.brief && <p className="mt-3 line-clamp-3 text-sm text-ink-2">{o.brief}</p>}

              {o.role === "creator" && o.brandMetrics && (
                <div className="mt-3">
                  <BrandSnapshot metrics={o.brandMetrics} compact />
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <div className="text-sm">
                  <span className="font-display font-semibold text-ink">{formatNaira(o.price_naira)}</span>
                  {o.role === "brand" && (
                    <span className="ml-2 text-xs text-ink-3">+ {formatNaira(feeFor(o.price_naira))} fee</span>
                  )}
                </div>

                <div className="flex gap-2">
                  {o.role === "creator" && o.status === "pending" && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => run(o.id, () => declineOfferAction(o.id))} disabled={busy}>Decline</Button>
                      <Button size="sm" loading={busy} onClick={() => run(o.id, () => acceptOfferAction(o.id))}>Accept</Button>
                    </>
                  )}
                  {o.role === "creator" && o.status === "accepted" && (
                    <span className="text-xs text-ink-3">Waiting for the brand to fund escrow.</span>
                  )}
                  {o.role === "brand" && o.status === "pending" && (
                    <Button size="sm" variant="ghost" onClick={() => run(o.id, () => declineOfferAction(o.id))} disabled={busy}>Withdraw</Button>
                  )}
                  {o.role === "brand" && o.status === "accepted" && (
                    <Button size="sm" loading={busy} onClick={() => run(o.id, () => fundOfferAction(o.id))}>Fund escrow</Button>
                  )}
                </div>
              </div>

              {note[o.id] && <p className="mt-2 text-xs text-warning">{note[o.id]}</p>}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
