"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, ShieldAlert, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { setLocationVisitedAction } from "@/app/gigs/actions";

// Brand needs the creator to shoot in person at a store/venue. Shows the address
// (participants only) + a safety disclaimer, and lets the creator confirm the visit.
export function LocationVisit({ gigId, role, address, status }: { gigId: string; role: "brand" | "creator"; address: string | null; status: string | null }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [showSafety, setShowSafety] = useState(false);
  const [pending, start] = useTransition();
  const done = status === "visited";

  function markVisited() {
    setErr(null);
    start(async () => {
      const r = await setLocationVisitedAction(gigId);
      if (r.error) setErr(r.error);
      else router.refresh();
    });
  }

  return (
    <Card className="mb-6 border-accent/30">
      <CardBody>
        <p className="flex items-center gap-2 font-semibold text-ink">
          <MapPin className="size-4 text-accent" /> On-location shoot
        </p>
        <p className="mt-0.5 text-sm text-ink-2">
          {role === "brand" ? "The creator will come to your venue to film." : "The brand wants you to film at their location."}
        </p>

        {address && (
          <div className="mt-3 rounded-xl bg-surface-2 p-3 text-sm">
            <p className="text-xs font-medium text-ink-3">Location</p>
            <p className="mt-0.5 whitespace-pre-wrap text-ink">{address}</p>
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          {done ? (
            <p className="flex items-center gap-1.5 text-sm text-ink-2"><Check className="size-4 text-success" /> Visit completed.</p>
          ) : role === "creator" ? (
            <>
              <Button variant="secondary" onClick={() => setShowSafety(true)}>Review safety &amp; confirm visit</Button>
            </>
          ) : (
            <p className="text-sm text-ink-3">Waiting for the creator to confirm the visit.</p>
          )}
        </div>
        {err && <p className="mt-2 text-sm text-error">{err}</p>}
      </CardBody>

      {showSafety && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-obsidian/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <p className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                <ShieldAlert className="size-5 text-warning" /> Before you go
              </p>
              <button onClick={() => setShowSafety(false)} aria-label="Close" className="text-ink-3 hover:text-ink"><X className="size-5" /></button>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-ink-2">
              <li>• Confirm the exact address and a contact in UGCOrigin chat before travelling.</li>
              <li>• Shoot during business hours; tell someone you trust where you&rsquo;re going.</li>
              <li>• Meet at the public storefront/venue, not a private residence.</li>
              <li>• If anything feels off, leave and report it to us, your payment is protected.</li>
              <li>• UGCOrigin facilitates the booking but isn&rsquo;t present at the shoot.</li>
            </ul>
            <Button className="mt-5 w-full" onClick={() => { setShowSafety(false); markVisited(); }} loading={pending}>
              I&rsquo;ve completed the visit
            </Button>
            <button onClick={() => setShowSafety(false)} className="mt-2 w-full text-center text-xs text-ink-3 hover:text-ink">Not yet</button>
          </div>
        </div>
      )}
    </Card>
  );
}
