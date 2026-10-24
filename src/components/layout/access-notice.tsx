import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Clean role-gate state for pages a viewer's role can't act on. Shown instead
 * of a broken/guarded form, e.g. a creator opening the Post-a-brief page.
 */
export function AccessNotice({
  title,
  message,
  cta,
}: {
  title: string;
  message: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-3xl border border-line bg-surface px-6 py-16 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent-tint text-accent">
        <Lock className="size-6" />
      </div>
      <h1 className="mt-4 font-display text-xl font-semibold text-ink">{title}</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-2">{message}</p>
      {cta && (
        <Link href={cta.href} className="mt-5 inline-block">
          <Button>{cta.label}</Button>
        </Link>
      )}
    </div>
  );
}
