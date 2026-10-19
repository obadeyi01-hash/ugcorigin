"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const FADE = 28; // px of soft fade at each overflowing edge

/**
 * A single-line, horizontally scrollable row of pills/chips/categories.
 * Never wraps, scrolls on overflow (swipe/trackpad), scrollbar hidden. The
 * edges fade softly (mask gradient) only on the side(s) with hidden content, so
 * there's a smooth hint of more rather than a hard clipped edge.
 */
export function PillRow({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<{ left: boolean; right: boolean }>({ left: false, right: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const left = el.scrollLeft > 1;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setEdges((p) => (p.left === left && p.right === right ? p : { left, right }));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
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
        "flex w-full min-w-0 max-w-full flex-nowrap items-center gap-2 overflow-x-auto overscroll-x-contain scroll-smooth",
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
