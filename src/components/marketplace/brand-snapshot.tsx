import { CheckCircle2, Star, Wallet, ShieldAlert } from "lucide-react";

export type BrandMetrics = {
  gigs_posted?: number | null;
  gigs_funded?: number | null;
  gigs_completed?: number | null;
  disputes?: number | null;
  avg_rating?: number | null;
  review_count?: number | null;
};

/**
 * Brand reliability signals for creators — how a brand actually pays and
 * behaves. Real on-platform outcomes only; shows nothing for a brand-new brand.
 */
export function BrandSnapshot({ metrics, compact = false }: { metrics: BrandMetrics; compact?: boolean }) {
  const posted = metrics.gigs_posted ?? 0;
  const funded = metrics.gigs_funded ?? 0;
  const fundRate = posted > 0 ? Math.round((funded / posted) * 100) : null;

  const items: { icon: typeof Star; label: string; value: string }[] = [];
  if (funded > 0) items.push({ icon: Wallet, label: "Gigs funded", value: String(funded) });
  if (fundRate !== null && posted >= 3) items.push({ icon: CheckCircle2, label: "Funds what it posts", value: `${fundRate}%` });
  if ((metrics.review_count ?? 0) > 0 && metrics.avg_rating) items.push({ icon: Star, label: "Creator rating", value: metrics.avg_rating.toFixed(1) });
  if ((metrics.disputes ?? 0) > 0) items.push({ icon: ShieldAlert, label: "Disputes", value: String(metrics.disputes) });

  if (items.length === 0) return null;

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-2">
        {items.slice(0, 3).map((it) => (
          <span key={it.label} className="inline-flex items-center gap-1">
            <it.icon className="size-3.5 text-accent" /> <span className="font-semibold text-ink">{it.value}</span> {it.label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-xs font-semibold text-ink-3">Brand reliability</p>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="text-center">
            <it.icon className="mx-auto size-4 text-accent" />
            <p className="mt-1 font-display text-lg font-bold text-ink">{it.value}</p>
            <p className="text-2xs text-ink-3">{it.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
