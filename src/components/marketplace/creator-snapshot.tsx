import { CheckCircle2, Clock, Star, Repeat, Timer } from "lucide-react";

export type CreatorMetrics = {
  gigs_completed?: number | null;
  on_time_rate?: number | null;
  avg_rating?: number | null;
  review_count?: number | null;
  repeat_hire_rate?: number | null;
  response_time_mins?: number | null;
};

function respond(mins: number): string {
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / 1440)}d`;
}

/**
 * Real, verified trust signals from on-platform outcomes (creator_metrics).
 * Shows only what is actually true — nothing fabricated, so a brand-new creator
 * sees nothing here until they deliver. Used on the public profile and in the
 * proposal/search snapshot.
 */
export function CreatorSnapshot({ metrics, compact = false }: { metrics: CreatorMetrics; compact?: boolean }) {
  const items: { icon: typeof Star; label: string; value: string }[] = [];
  if ((metrics.gigs_completed ?? 0) > 0) items.push({ icon: CheckCircle2, label: "Gigs done", value: String(metrics.gigs_completed) });
  if ((metrics.review_count ?? 0) > 0 && metrics.avg_rating) items.push({ icon: Star, label: "Rating", value: metrics.avg_rating.toFixed(1) });
  if ((metrics.on_time_rate ?? 0) > 0) items.push({ icon: Clock, label: "On-time", value: `${Math.round(metrics.on_time_rate!)}%` });
  if ((metrics.repeat_hire_rate ?? 0) > 0) items.push({ icon: Repeat, label: "Repeat hire", value: `${Math.round(metrics.repeat_hire_rate!)}%` });
  if (metrics.response_time_mins) items.push({ icon: Timer, label: "Responds", value: respond(metrics.response_time_mins) });

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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="rounded-2xl border border-line bg-surface p-4 text-center">
          <it.icon className="mx-auto size-5 text-accent" />
          <p className="mt-1.5 font-display text-xl font-bold text-ink">{it.value}</p>
          <p className="text-xs text-ink-3">{it.label}</p>
        </div>
      ))}
    </div>
  );
}
