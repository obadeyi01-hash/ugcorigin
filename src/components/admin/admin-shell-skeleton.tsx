import { Logo } from "@/components/ui/logo";
import { Container } from "@/components/ui/container";

/**
 * Static chrome shown while an admin page's data streams in. It mirrors
 * {@link AdminShell}'s layout — the header bar, the left nav rail and a content
 * block — so moving between admin sections reads as content loading in place
 * rather than a full-page reload. The real shell replaces it once the section's
 * RBAC check and queries resolve. With Cache Components on, this is also the
 * prerendered static shell served on a direct visit.
 */
export function AdminShellSkeleton() {
  return (
    <div className="min-h-dvh" role="status" aria-busy="true">
      <span className="sr-only">Loading admin workspace…</span>
      <header className="border-b border-line bg-paper/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo variant="combined" size={30} />
            <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-paper">Admin</span>
          </div>
          <span className="h-5 w-16 animate-pulse rounded-full bg-surface-2" aria-hidden />
        </Container>
      </header>

      <Container className="grid gap-8 py-8 md:grid-cols-[200px_1fr]">
        <nav className="hidden gap-1 md:flex md:flex-col" aria-hidden>
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="h-9 animate-pulse rounded-xl bg-surface-2" />
          ))}
        </nav>
        <div className="min-w-0" aria-hidden>
          <span className="block h-8 w-48 animate-pulse rounded-lg bg-surface-2" />
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="block h-24 animate-pulse rounded-2xl bg-surface-2" />
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
