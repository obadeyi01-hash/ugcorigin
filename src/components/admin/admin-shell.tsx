"use client";

import type { ElementType, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BadgeCheck, Users, Briefcase, Banknote, Scale, Shield, Layers, Rocket, BookOpen, Flag, MessageSquare, LifeBuoy, Megaphone, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
// Client component: import the pure model from ./roles, never ./rbac (which pulls
// in server-only Supabase/redirect code).
import { sectionsFor, ROLE_LABEL, type AdminRole, type Section } from "@/lib/admin/roles";

const NAV: { section: Section; label: string; href: string; icon: ElementType }[] = [
  { section: "overview", label: "Overview", href: "/admin", icon: LayoutDashboard },
  { section: "verification", label: "Verification", href: "/admin/verification", icon: BadgeCheck },
  { section: "users", label: "Users", href: "/admin/users", icon: Users },
  { section: "gigs", label: "Gigs", href: "/admin/gigs", icon: Briefcase },
  { section: "finance", label: "Finance", href: "/admin/finance", icon: Banknote },
  { section: "disputes", label: "Disputes", href: "/admin/disputes", icon: Scale },
  { section: "moderation", label: "Moderation", href: "/admin/moderation", icon: Flag },
  { section: "messages", label: "Messages", href: "/admin/messages", icon: MessageSquare },
  { section: "support", label: "Support", href: "/admin/support", icon: LifeBuoy },
  { section: "comms", label: "Notifications", href: "/admin/notifications", icon: Megaphone },
  { section: "tiers", label: "Tiers", href: "/admin/tiers", icon: Layers },
  { section: "boosts", label: "Boosts", href: "/admin/boosts", icon: Rocket },
  { section: "docs", label: "Docs", href: "/admin/docs", icon: BookOpen },
  { section: "roles", label: "Roles", href: "/admin/roles", icon: Shield },
];

/** The nav item whose href is the longest prefix of the current path wins, so
 *  `/admin/users/123` lights up "Users" and a bare `/admin` lights up "Overview". */
function activeSection(pathname: string): Section | null {
  let best: { section: Section; len: number } | null = null;
  for (const n of NAV) {
    if (pathname === n.href || pathname.startsWith(`${n.href}/`)) {
      if (!best || n.href.length > best.len) best = { section: n.section, len: n.href.length };
    }
  }
  return best?.section ?? null;
}

/**
 * Admin console chrome. Rendered once by `app/admin/layout.tsx` and kept mounted
 * across admin routes, so moving between sections is instant client navigation —
 * only the page content below swaps, the header and nav never reload.
 *
 * `/admin/mfa` is the pre-2FA gate and brings its own chrome, so the shell steps
 * aside there and renders the page bare.
 */
export function AdminShell({ role, children }: { role: AdminRole; children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/mfa") return <>{children}</>;

  const allowed = sectionsFor(role);
  const items = NAV.filter((n) => allowed.includes(n.section));
  const active = activeSection(pathname);

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-paper/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/"><Logo variant="combined" size={30} /></Link>
            <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-paper">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/mfa"
              title="Two-factor authentication"
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <ShieldCheck className="size-4 text-accent" /> 2FA
            </Link>
            <span className="text-sm font-medium text-ink-3">{ROLE_LABEL[role]}</span>
          </div>
        </Container>
      </header>

      <Container className="grid gap-8 py-8 md:grid-cols-[200px_1fr]">
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {items.map((n) => {
            const isActive = n.section === active;
            return (
              <Link
                key={n.section}
                href={n.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-ink text-paper" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                )}
              >
                <n.icon className="size-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="min-w-0">{children}</div>
      </Container>
    </div>
  );
}
