import * as React from "react";
import { cn } from "@/lib/utils";

/** Niche / category tag. `active` for selected filter state. */
export function Chip({
  className,
  active = false,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { active?: boolean }) {
  return (
    <span
      className={cn(
        "u-press inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border transition-colors cursor-default",
        active
          ? "bg-ink text-paper border-ink"
          : "bg-surface text-ink-2 border-line hover:border-line-strong hover:text-ink",
        className,
      )}
      {...props}
    />
  );
}
