"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Package, Truck, Check, ShieldAlert, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { setShippingAddressAction, setShippingStatusAction } from "@/app/gigs/actions";

const COURIERS: { name: string; url: string }[] = [
  { name: "Chowdeck", url: "https://chowdeck.com" },
  { name: "Glovo", url: "https://glovoapp.com" },
  { name: "inDrive", url: "https://indrive.com" },
  { name: "Bolt", url: "https://bolt.eu" },
];

type Props = {
  gigId: string;
  role: "brand" | "creator";
  address: string | null;
  status: string | null; // awaiting_address | address_set | sent | received
};

const STEPS = ["awaiting_address", "address_set", "sent", "received"];

export function ProductLogistics({ gigId, role, address, status }: Props) {
  const router = useRouter();
  const [addr, setAddr] = useState(address ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [showSafety, setShowSafety] = useState(false);
  const [pending, start] = useTransition();

  const stepIdx = Math.max(0, STEPS.indexOf(status ?? "awaiting_address"));

  function saveAddress() {
    setErr(null);
    start(async () => {
      const r = await setShippingAddressAction(gigId, addr);
      if (r.error) setErr(r.error);
      else router.refresh();
    });
  }

  function advance(s: "sent" | "received") {
    setErr(null);
    start(async () => {
      const r = await setShippingStatusAction(gigId, s);
      if (r.error) setErr(r.error);
      else router.refresh();
    });
  }

  return (
    <Card className="mb-6 border-accent/30">
      <CardBody>
        <p className="flex items-center gap-2 font-semibold text-ink">
          <Package className="size-4 text-accent" /> Physical product
        </p>

        {/* Progress */}
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {["Address", "Shipped", "Received"].map((label, i) => {
            const active = stepIdx >= i + 1;
            return (
              <div key={label} className="flex flex-1 items-center gap-1.5">
                <span className={`grid size-5 place-items-center rounded-full ${active ? "bg-success text-white" : "bg-surface-2 text-ink-3"}`}>
                  {active ? <Check className="size-3" /> : i + 1}
                </span>
                <span className={active ? "text-ink" : "text-ink-3"}>{label}</span>
                {i < 2 && <span className="h-px flex-1 bg-line" />}
              </div>
            );
          })}
        </div>

        {/* Creator: set address */}
        {role === "creator" && stepIdx < 1 && (
          <div className="mt-4">
            <p className="text-sm text-ink-2">Share where the brand should send the product. Only they can see it.</p>
            <Textarea value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Full delivery address + a landmark, and your phone for the courier." className="mt-2 min-h-20" />
            <Button className="mt-2" onClick={saveAddress} loading={pending} disabled={addr.trim().length < 8}>Share delivery address</Button>
          </div>
        )}

        {/* Address shown once set */}
        {address && stepIdx >= 1 && (
          <div className="mt-4 rounded-xl bg-surface-2 p-3 text-sm">
            <p className="text-xs font-medium text-ink-3">Deliver to</p>
            <p className="mt-0.5 whitespace-pre-wrap text-ink">{address}</p>
          </div>
        )}

        {/* Brand: arrange + mark sent */}
        {role === "brand" && stepIdx >= 1 && stepIdx < 2 && (
          <div className="mt-4">
            <Button variant="secondary" onClick={() => setShowSafety(true)}>
              <Truck className="size-4" /> Arrange delivery
            </Button>
          </div>
        )}

        {/* Status line */}
        {stepIdx >= 2 && (
          <p className="mt-4 flex items-center gap-1.5 text-sm text-ink-2">
            <Truck className="size-4 text-success" />
            {stepIdx >= 3 ? "Delivered — the creator confirmed receipt." : "On the way to the creator."}
          </p>
        )}
        {role === "creator" && stepIdx === 2 && (
          <Button className="mt-2" variant="secondary" onClick={() => advance("received")} loading={pending}>
            <Check className="size-4" /> I received it
          </Button>
        )}

        {err && <p className="mt-2 text-sm text-error">{err}</p>}
      </CardBody>

      {/* Safety disclaimer popup */}
      {showSafety && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-obsidian/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <p className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                <ShieldAlert className="size-5 text-warning" /> Stay safe shipping
              </p>
              <button onClick={() => setShowSafety(false)} aria-label="Close" className="text-ink-3 hover:text-ink"><X className="size-5" /></button>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-ink-2">
              <li>• Use a <strong>tracked courier</strong> and keep the tracking reference.</li>
              <li>• Prefer <strong>doorstep handoff</strong>; if meeting in person, pick a busy public place in daylight.</li>
              <li>• Don&rsquo;t send cash or valuables beyond the product itself.</li>
              <li>• Keep all arrangements and proof in UGCOrigin chat, so our team can help if something goes wrong.</li>
              <li>• UGCOrigin isn&rsquo;t the carrier and isn&rsquo;t liable for courier loss or damage.</li>
            </ul>
            <div className="mt-4">
              <p className="text-xs font-medium text-ink-3">Book a local courier</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {COURIERS.map((c) => (
                  <a key={c.name} href={c.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-2 hover:border-accent hover:text-accent">
                    {c.name} <ExternalLink className="size-3" />
                  </a>
                ))}
              </div>
            </div>
            <Button className="mt-5 w-full" onClick={() => { setShowSafety(false); advance("sent"); }} loading={pending}>
              I understand — mark as sent
            </Button>
            <button onClick={() => setShowSafety(false)} className="mt-2 w-full text-center text-xs text-ink-3 hover:text-ink">Not yet</button>
          </div>
        </div>
      )}
    </Card>
  );
}
