import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitize a user-supplied search term before it is interpolated into a
 * PostgREST filter string such as supabase `.or("col.ilike.%term%")`.
 *
 * PostgREST parses that string: commas separate OR-conditions, parentheses
 * group them, and `*`/`%`/`_` are LIKE wildcards. Interpolating raw user input
 * lets an attacker inject extra conditions (a boolean oracle over columns they
 * can't SELECT, e.g. phone) or break the query. We strip every character with
 * meaning in that grammar and the wildcards, and cap the length. The result is
 * only ever used as a literal substring inside an ilike pattern.
 */
export function sanitizeSearchTerm(input: string, maxLen = 60): string {
  return input
    .replace(/[,()*%\\:"'`]/g, " ") // neutralize PostgREST/LIKE metacharacters
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

/** Format a Naira amount, e.g. formatNaira(50000) -> "₦50,000". */
export function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}
