// Pure RBAC model (roles, sections, access map) with NO server imports, so it
// is safe to import from client components. The server-only guards that read
// the session live in ./rbac (which re-exports everything here).

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
