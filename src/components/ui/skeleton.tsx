import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";

/** A single shimmering placeholder block. Decorative — hidden from assistive tech. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("block animate-pulse rounded-xl bg-surface-2", className)} />;
}

/**
 * Generic content placeholder for a data page whose header already renders
 * outside the Suspense boundary. Keeps the layout from collapsing to a blank
 * screen while the page's data streams in, so navigation reads as instant.
 */
export function PageContentSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Container className="py-10 sm:py-14" role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-8 w-56 rounded-lg" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <div className="mt-8 grid gap-4">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    </Container>
  );
}

/**
 * Content-column placeholder for an admin section. The shell (header + nav) is
 * rendered by `app/admin/layout.tsx` and stays mounted, so a section only needs
 * to fill its own column while its data streams in.
 */
export function AdminContentSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-8 w-48 rounded-lg" />
      <div className="mt-6 grid gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/**
 * Placeholder for a detail page. Use inside an existing `<Container>` (unlike
 * {@link PageContentSkeleton}, which brings its own) so navigating into a brief,
 * campaign or gig keeps the page frame instead of blanking to white.
 */
export function DetailSkeleton() {
  return (
    <div className="py-10" role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-9 w-2/3 max-w-md rounded-lg" />
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-5/6" />
      <Skeleton className="mt-8 h-64 rounded-2xl" />
    </div>
  );
}
