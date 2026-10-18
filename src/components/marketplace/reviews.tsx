import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReportButton } from "@/components/moderation/report-button";

export type ReviewItem = {
  id: string;
  rating: number; // 1..5 average of the three
  body: string | null;
  reviewer: string;
};

function StarRow({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5", className)} aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn("size-4", n <= Math.round(value) ? "fill-accent text-accent" : "text-ink-3/40")} />
      ))}
    </span>
  );
}

export function Reviews({ reviews, average }: { reviews: ReviewItem[]; average: number }) {
  return (
    <section className="mt-10">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">Reviews</h2>
        {reviews.length > 0 && (
          <span className="inline-flex items-center gap-1.5 text-sm">
            <StarRow value={average} />
            <span className="font-semibold text-ink">{average.toFixed(1)}</span>
            <span className="text-ink-3">({reviews.length})</span>
          </span>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="mt-3 text-sm text-ink-3">No reviews yet.</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between">
                <StarRow value={r.rating} />
                <span className="text-xs text-ink-3">{r.reviewer}</span>
              </div>
              {r.body && <p className="mt-2 text-sm text-ink-2">{r.body}</p>}
              <div className="mt-2 flex justify-end">
                <ReportButton targetType="review" targetId={r.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
