import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/rbac";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminShellSkeleton } from "@/components/admin/admin-shell-skeleton";

/**
 * Resolves the admin role once and renders the console chrome. Because this is a
 * layout, Next.js keeps it mounted while navigating between admin routes — only
 * the page below re-renders — so section-to-section clicks are instant.
 *
 * This reads the session (cookies), so it's wrapped in Suspense: the first visit
 * into /admin shows the shell skeleton while the role resolves. Per-section access
 * and the MFA gate are still enforced by each page's `requireSection`; this only
 * needs the role for the nav, and must NOT enforce aal2 or `/admin/mfa` would loop.
 */
async function AdminFrame({ children }: { children: React.ReactNode }) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/dashboard");
  return <AdminShell role={ctx.role}>{children}</AdminShell>;
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<AdminShellSkeleton />}>
      <AdminFrame>{children}</AdminFrame>
    </Suspense>
  );
}
