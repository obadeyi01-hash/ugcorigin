"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Cards as a snap-scroll carousel on mobile, and a normal grid on sm+ screens.
 * Pass the desktop grid classes in `gridClass`, e.g. "sm:grid-cols-2 lg:grid-cols-4".
 */
export function CardScroller({ children, gridClass, className }: { children: ReactNode; gridClass: string; className?: string }) {
  return (
    <div
      className={cn(
        // Mobile: horizontal snap carousel.
        "-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 scroll-smooth overscroll-x-contain",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "[&>*]:w-[78%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-auto",
        // sm+: a normal grid.
        "sm:mx-0 sm:grid sm:snap-none sm:gap-5 sm:overflow-visible sm:px-0",
        gridClass,
        className,
      )}
    >
      {children}
    </div>
  );
}
