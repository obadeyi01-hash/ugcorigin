// Name display rules. Public views see a privacy-preserving "First L."; the full
// legal name is revealed only once a funded contract exists between the two
// parties. Falls back to the freeform display_name for profiles created before
// structured names existed.

export type NameParts = {
  first?: string | null;
  middle?: string | null;
  last?: string | null;
  display?: string | null;
  handle?: string | null;
};

function clean(s?: string | null) {
  return (s ?? "").trim();
}

/** "First L." — safe to show publicly. */
export function publicName(p: NameParts): string {
  const first = clean(p.first);
  const last = clean(p.last);
  if (first) return last ? `${first} ${last[0].toUpperCase()}.` : first;
  const display = clean(p.display);
  if (display) {
    // Mask a two-word freeform display too (e.g. "Amara Obi" -> "Amara O.").
    const parts = display.split(/\s+/);
    if (parts.length >= 2) return `${parts[0]} ${parts[1][0].toUpperCase()}.`;
    return display;
  }
  return clean(p.handle) ? `@${clean(p.handle)}` : "Creator";
}

/** Full legal name — only after the trust gate (funded contract) is met. */
export function fullName(p: NameParts): string {
  const parts = [clean(p.first), clean(p.middle), clean(p.last)].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return clean(p.display) || (clean(p.handle) ? `@${clean(p.handle)}` : "Creator");
}

/** Resolve the right name for a viewer given whether the trust gate is met. */
export function displayNameFor(p: NameParts, revealed: boolean): string {
  return revealed ? fullName(p) : publicName(p);
}
