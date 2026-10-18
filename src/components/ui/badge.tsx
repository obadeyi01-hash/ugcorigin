import * as React from "react";
import { cn } from "@/lib/utils";

type Variant =
  | "default"
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "outline";

const variants: Record<Variant, string> = {
  default: "bg-surface-2 text-ink-2",
  accent: "bg-accent-tint text-accent-hover",
  success: "bg-success/12 text-success",
  warning: "bg-warning/14 text-warning",
  error: "bg-error/12 text-error",
  info: "bg-info/12 text-info",
  outline: "border border-line-strong text-ink-2",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
