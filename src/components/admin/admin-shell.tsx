import type { ElementType, ReactNode } from "react";
import Link from "next/link";
import { LayoutDashboard, BadgeCheck, Users, Briefcase, Banknote, Scale, Shield, Layers, Rocket, BookOpen, Flag, MessageSquare } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import { sectionsFor, ROLE_LABEL, type AdminRole, type Section } from "@/lib/admin/rbac";

const NAV: { section: Section; label: string; href: string; icon: ElementType }[] = [
  { section: "overview", label: "Overview", href: "/admin", icon: LayoutDashboard },
  { section: "verification", label: "Verification", href: "/admin/verification", icon: BadgeCheck },
  { section: "users", label: "Users", href: "/admin/users", icon: Users },
  { section: "gigs", label: "Gigs", href: "/admin/gigs", icon: Briefcase },
  { section: "finance", label: "Finance", href: "/admin/finance", icon: Banknote },
  { section: "disputes", label: "Disputes", href: "/admin/disputes", icon: Scale },
  { section: "moderation", label: "Moderation", href: "/admin/moderation", icon: Flag },
  { section: "messages", label: "Messages", href: "/admin/messages", icon: MessageSquare },
  { section: "tiers", label: "Tiers", href: "/admin/tiers", icon: Layers },
  { section: "boosts", label: "Boosts", href: "/admin/boosts", icon: Rocket },
  { section: "docs", label: "Docs", href: "/admin/docs", icon: BookOpen },
  { section: "roles", label: "Roles", href: "/admin/roles", icon: Shield },
];

export function AdminShell({
  role,
  active,
  children,
}: {
  role: AdminRole;
  active: Section;
  children: ReactNode;
}) {
  const allowed = sectionsFor(role);
  const items = NAV.filter((n) => allowed.includes(n.section));

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-paper/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/"><Logo variant="combined" size={30} /></Link>
            <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-paper">Admin</span>
          </div>
          <span className="text-sm font-medium text-ink-3">{ROLE_LABEL[role]}</span>
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
