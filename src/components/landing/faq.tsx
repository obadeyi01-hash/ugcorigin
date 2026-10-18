import { ChevronDown } from "lucide-react";

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
      {items.map((it) => (
        <details key={it.q} className="group p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-ink [&::-webkit-details-marker]:hidden">
            {it.q}
            <ChevronDown className="size-5 shrink-0 text-ink-3 transition-transform group-open:rotate-180" />
          </summary>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">{it.a}</p>
        </details>
      ))}
    </div>
  );
}
