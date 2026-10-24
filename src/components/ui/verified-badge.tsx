import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** The "Verified Human" trust badge, core to the anti-AI positioning. */
export function VerifiedBadge({
  label = "Verified Human",
  className,
  compact = false,
}: {
  label?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium text-accent-hover bg-accent-tint",
        compact ? "px-1.5 py-0.5 text-2xs" : "px-2.5 py-1 text-xs",
        className,
      )}
      title="Identity-verified real human creator"
    >
      <BadgeCheck className={compact ? "size-3" : "size-3.5"} aria-hidden />
      {!compact && label}
    </span>
  );
}
