export const ADMIN_PAGE_SIZE = 25;

export function readPage(raw: string | undefined) {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

/** Strip characters that would break a PostgREST ilike filter. */
export function readQuery(raw: string | undefined) {
  return (raw ?? "").replace(/[%_,]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

export function pageWindow(page: number, size = ADMIN_PAGE_SIZE) {
  const from = (page - 1) * size;
  return { from, to: from + size - 1 };
}

export function pageCount(total: number | null | undefined, size = ADMIN_PAGE_SIZE) {
  return Math.max(1, Math.ceil((total ?? 0) / size));
}
