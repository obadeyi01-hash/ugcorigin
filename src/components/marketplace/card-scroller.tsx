"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const FADE = 28;

/**
 * Cards as a snap-scroll carousel on mobile (with soft fading edges), and a
 * normal grid on sm+ screens. Pass the desktop grid classes in `gridClass`,
 * e.g. "sm:grid-cols-2 lg:grid-cols-4".
 */
export function CardScroller({ children, gridClass, className }: { children: ReactNode; gridClass: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // Only fade while it's actually a horizontal scroller (mobile).
    const scrollable = el.scrollWidth > el.clientWidth + 1;
    const left = scrollable && el.scrollLeft > 1;
    const right = scrollable && el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setEdges((p) => (p.left === left && p.right === right ? p : { left, right }));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const mask =
    edges.left && edges.right
      ? `linear-gradient(to right, transparent 0, #000 ${FADE}px, #000 calc(100% - ${FADE}px), transparent 100%)`
      : edges.left
        ? `linear-gradient(to right, transparent 0, #000 ${FADE}px)`
        : edges.right
          ? `linear-gradient(to right, #000 calc(100% - ${FADE}px), transparent 100%)`
          : undefined;

  return (
    <div
      ref={ref}
      onScroll={update}
      style={mask ? { WebkitMaskImage: mask, maskImage: mask } : undefined}
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
