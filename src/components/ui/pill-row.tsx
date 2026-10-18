import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A single-line, horizontally scrollable row of pills/chips/categories.
 * Never wraps to a second line, on overflow it scrolls (swipe on touch,
 * trackpad/drag on desktop) with the scrollbar hidden. Direct children are
 * forced shrink-0 + nowrap so they keep their size instead of stacking.
 */
export function PillRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-nowrap items-center gap-2 overflow-x-auto overscroll-x-contain scroll-smooth",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "[&>*]:shrink-0 [&>*]:whitespace-nowrap",
        "-mx-1 px-1 py-0.5",
        className,
      )}
    >
      {children}
    </div>
  );
}
