import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "symbol" | "wordmark" | "combined" | "stacked";
  className?: string;
  /** Height in px for the mark. */
  size?: number;
};

/** The real UGCOrigin mark (transparent PNG). */
export function LogoSymbol({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <Image
      src="/brand/symbol.png"
      alt="UGCOrigin"
      width={size}
      height={size}
      priority
      className={cn("object-contain", className)}
      style={{ height: size, width: "auto" }}
    />
  );
}

export function Logo({ variant = "combined", className, size = 30 }: LogoProps) {
  if (variant === "symbol") {
    return <LogoSymbol className={className} size={size} />;
  }

  if (variant === "wordmark") {
    return (
      <span className={cn("font-display leading-none", className)}>
        <span className="font-bold tracking-tight text-accent">UGC</span>
        <span className="font-normal tracking-[0.08em] text-ink-2">ORIGIN</span>
      </span>
    );
  }

  if (variant === "stacked") {
    return (
      <Image
        src="/brand/logo-stacked.png"
        alt="UGCOrigin"
        width={160}
        height={222}
        className={cn("object-contain", className)}
        style={{ width: size, height: "auto" }}
      />
    );
  }

  // combined (horizontal): real mark + wordmark
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoSymbol size={size} />
      <span className="font-display text-[1.15rem] leading-none">
        <span className="font-bold tracking-tight text-accent">UGC</span>
        <span className="font-normal tracking-[0.06em] text-ink-2">ORIGIN</span>
      </span>
    </span>
  );
}
