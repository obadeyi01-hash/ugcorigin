import * as React from "react";
import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "elevated" | "outline" | "soft";
  interactive?: boolean;
};

const variants = {
  elevated: "bg-surface border border-line shadow-sm",
  outline: "bg-surface border border-line",
  soft: "bg-surface-2 border border-transparent",
};

export function Card({
  className,
  variant = "elevated",
  interactive = false,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl",
        variants[variant],
        interactive && "u-lift cursor-pointer",
        className,
      )}
      {...props}
    />
  );
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pb-0", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("p-5 pt-0 flex items-center gap-3", className)}
      {...props}
    />
  );
}
