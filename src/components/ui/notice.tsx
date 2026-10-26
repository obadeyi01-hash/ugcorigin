import Link from "next/link";

const tones = {
  info: "border-line bg-surface text-ink",
  warning: "border-warning/30 bg-warning/10 text-ink",
  success: "border-success/30 bg-success/10 text-ink",
  error: "border-error/30 bg-error/10 text-ink",
} as const;

/** Page or form alert. Stays on screen until the condition that raised it is gone. */
export function Notice({
  tone = "info",
  title,
  children,
  href,
  action,
}: {
  tone?: keyof typeof tones;
  title?: string;
  children?: React.ReactNode;
  href?: string;
  action?: string;
}) {
  return (
    <div role="status" className={`rounded-2xl border px-4 py-3 text-sm ${tones[tone]}`}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? "mt-1 text-ink-2" : "text-ink-2"}>{children}</div>}
      {href && action && (
        <Link href={href} className="mt-2 inline-block font-medium text-accent hover:underline">
          {action}
        </Link>
      )}
    </div>
  );
}
