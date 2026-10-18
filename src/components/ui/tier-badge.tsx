import { tierMeta } from "@/lib/tiers";
import { cn } from "@/lib/utils";

/**
 * Tier label pill. Styling strengthens with rank (subtle, no gradients/sparkles):
 * low tiers are quiet, high tiers carry the accent. Real tier only, never faked.
 */
export function TierBadge({
  tier,
  size = "sm",
  className,
}: {
  tier: string | null | undefined;
  size?: "sm" | "md";
  className?: string;
}) {
  const meta = tierMeta(tier);
  const look =
    meta.rank >= 5
      ? "bg-accent text-accent-ink border-accent"
      : meta.rank >= 3
        ? "bg-accent-tint text-accent border-accent/25"
        : "bg-surface-2 text-ink-2 border-line";

  return (
    <span
      title={meta.tagline}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold tracking-tight",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        look,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
