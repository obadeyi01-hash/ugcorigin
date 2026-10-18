import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  className,
}: {
  value: number;
  count?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm", className)}>
      <Star className="size-4 fill-accent text-accent" aria-hidden />
      <span className="font-semibold text-ink">{value.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-ink-3">({count})</span>
      )}
    </span>
  );
}
