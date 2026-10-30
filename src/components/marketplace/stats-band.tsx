import { Reveal } from "@/components/ui/reveal";

/**
 * Product facts, true, structural statements about how UGCOrigin works, not
 * fabricated usage metrics. Framed to land for both sides: brands read
 * affordable + safe ("From ₦10k", "Escrow"), creators read earn-well + fast
 * ("100%", "Next-day"). "From ₦10k" mirrors the Origin-tier price floor
 * (src/lib/tiers.ts), the lowest a verified creator can be hired for.
 * Live counts (creators, gigs, GMV) will join these only once real + past a
 * threshold.
 */
const facts = [
  { value: "From ₦10k", label: "Hire a verified creator", sub: "Affordable to start" },
  { value: "100%", label: "Creators keep their rate", sub: "No cut from what you earn" },
  { value: "Next-day", label: "Payouts to your bank", sub: "Approved work pays fast" },
  { value: "Protected", label: "On every single deal", sub: "Payment protected both ways" },
];

export function StatsBand() {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-4">
      {facts.map((s, i) => (
        <Reveal key={s.label} delay={i * 60} className="bg-surface">
          <div className="p-6 text-center sm:p-8">
            <p className="font-display text-stat font-bold text-ink">
              {s.value}
            </p>
            <p className="mt-1 text-sm font-medium text-ink">{s.label}</p>
            <p className="mt-0.5 text-xs text-ink-3">{s.sub}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
