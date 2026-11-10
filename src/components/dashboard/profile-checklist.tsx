import Link from "next/link";
import { Check } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { buildCreatorChecklist } from "@/lib/creators/completion";

/**
 * "Finish setting up your profile" — a live checklist on the creator dashboard.
 * It deliberately lists verification as just one item among several, so a
 * creator whose identity check is still processing keeps building (videos,
 * portfolio, rate) instead of stalling. Hides itself once everything is done.
 */
export function ProfileChecklist(props: Parameters<typeof buildCreatorChecklist>[0]) {
  const { items, done, total, percent, complete } = buildCreatorChecklist(props);
  if (complete) return null;

  const multiNiche = (props.niches ?? []).length > 1;

  return (
    <Card className="mt-6 max-w-2xl">
      <CardBody>
        <div className="flex items-center justify-between gap-3">
          <p className="font-display font-semibold text-ink">Finish setting up your profile</p>
          <span className="shrink-0 text-sm font-medium text-ink-2">{done}/{total} done</span>
        </div>
        <p className="mt-1 text-sm text-ink-2">
          A complete profile gets shortlisted first. Do these in any order &mdash; you don&rsquo;t have to wait on verification to keep going.
        </p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${percent}%` }} />
        </div>

        <ul className="mt-4 grid gap-1.5">
          {items.map((item) => (
            <li key={item.key} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3 py-2.5">
              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  className={
                    item.done
                      ? "grid size-5 shrink-0 place-items-center rounded-full bg-success/15 text-success"
                      : "size-5 shrink-0 rounded-full border border-line-strong"
                  }
                >
                  {item.done && <Check className="size-3.5" />}
                </span>
                <span className={item.done ? "truncate text-sm text-ink-3 line-through" : "truncate text-sm text-ink"}>{item.label}</span>
              </span>
              {!item.done && (
                <Link href={item.href} className="shrink-0 text-sm font-medium text-accent hover:underline">
                  {item.cta}
                </Link>
              )}
            </li>
          ))}
        </ul>

        {multiNiche && (
          <p className="mt-3 text-xs text-ink-3">
            Tip: show at least one clip for each niche you picked, so brands see your range.
          </p>
        )}
      </CardBody>
    </Card>
  );
}
