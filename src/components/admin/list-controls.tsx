import Link from "next/link";

export type ListFilter = {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
};

export function AdminListControls({
  pathname,
  q,
  placeholder,
  filters,
  page,
  pages,
  total,
  pageParam = "page",
  queryParam = "q",
  search = true,
  hidden,
}: {
  pathname: string;
  q: string;
  placeholder: string;
  filters?: ListFilter[];
  page: number;
  pages: number;
  total: number;
  pageParam?: string;
  queryParam?: string;
  search?: boolean;
  hidden?: Record<string, string | undefined>;
}) {
  const keep = new URLSearchParams();
  if (q) keep.set(queryParam, q);
  for (const filter of filters ?? []) {
    if (filter.value && filter.value !== "all") keep.set(filter.name, filter.value);
  }
  for (const [key, value] of Object.entries(hidden ?? {})) {
    if (value) keep.set(key, value);
  }

  function href(nextPage: number) {
    const params = new URLSearchParams(keep);
    if (nextPage > 1) params.set(pageParam, String(nextPage));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  return (
    <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
      <form action={pathname} className="flex flex-wrap items-end gap-2">
        {Object.entries(hidden ?? {}).map(([key, value]) =>
          value ? <input key={key} type="hidden" name={key} value={value} /> : null,
        )}
        {search && (
          <label className="grid gap-1 text-xs text-ink-3">
            Search
            <input
              name={queryParam}
              defaultValue={q}
              placeholder={placeholder}
              className="h-9 w-56 rounded-full border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
        )}
        {filters?.map((filter) => (
          <label key={filter.name} className="grid gap-1 text-xs text-ink-3">
            {filter.label}
            <select
              name={filter.name}
              defaultValue={filter.value}
              className="h-9 rounded-full border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-accent"
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        ))}
        <button type="submit" className="h-9 rounded-full bg-ink px-4 text-sm font-medium text-paper">Apply</button>
      </form>
      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-3">
        <span>{total.toLocaleString("en-NG")} · page {page} of {pages}</span>
        {page > 1 && <Link href={href(page - 1)} className="rounded-full border border-line px-3 py-1 text-ink hover:border-accent">Previous</Link>}
        {page < pages && <Link href={href(page + 1)} className="rounded-full border border-line px-3 py-1 text-ink hover:border-accent">Next</Link>}
      </div>
    </div>
  );
}
