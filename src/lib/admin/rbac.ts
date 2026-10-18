import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminRole =
  | "super_admin"
  | "finance"
  | "trust_safety"
  | "support"
  | "growth"
  | "analyst";

export type Section =
  | "overview"
  | "verification"
  | "users"
  | "gigs"
  | "finance"
  | "disputes"
  | "tiers"
  | "boosts"
  | "docs"
  | "moderation"
  | "messages"
  | "roles";

// Which sections each role can see.
const ACCESS: Record<AdminRole, Section[]> = {
  super_admin: ["overview", "verification", "users", "gigs", "finance", "disputes", "tiers", "boosts", "docs", "moderation", "messages", "roles"],
  finance: ["overview", "gigs", "finance", "boosts"],
  trust_safety: ["overview", "verification", "users", "gigs", "disputes", "tiers", "docs", "moderation", "messages"],
  support: ["overview", "users", "gigs", "moderation", "messages"],
  growth: ["overview", "users", "tiers", "boosts", "docs"],
  analyst: ["overview", "users", "gigs", "finance", "disputes", "tiers", "boosts", "docs", "moderation", "messages"], // read-only
};

const READONLY = new Set<AdminRole>(["analyst"]);

export const ROLES: AdminRole[] = ["super_admin", "finance", "trust_safety", "support", "growth", "analyst"];

export const ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  finance: "Finance",
  trust_safety: "Trust & Safety",
  support: "Support",
  growth: "Growth",
  analyst: "Analyst",
};

export function canAccess(role: AdminRole, s: Section) {
  return ACCESS[role]?.includes(s) ?? false;
}
export function isReadonly(role: AdminRole) {
  return READONLY.has(role);
}
export function sectionsFor(role: AdminRole): Section[] {
  return ACCESS[role] ?? [];
}

export type AdminContext = { userId: string; role: AdminRole };

export async function getAdminContext(): Promise<AdminContext | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("admin_users").select("role").eq("user_id", user.id).maybeSingle();
  if (!data) return null;
  return { userId: user.id, role: (data.role as AdminRole) ?? "support" };
}

/** Page guard: ensures the viewer is an admin with access to `section`, else redirects. */
export async function requireSection(section: Section): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/dashboard");
  if (!canAccess(ctx.role, section)) redirect("/admin");
  return ctx;
}

/** Action guard: returns the context or an error if not permitted to WRITE in `section`. */
export async function guardWrite(section: Section): Promise<{ ctx?: AdminContext; error?: string }> {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Admin access required." };
  if (!canAccess(ctx.role, section)) return { error: "You don't have access to this." };
  if (isReadonly(ctx.role)) return { error: "Your role is read-only." };
  return { ctx };
}
