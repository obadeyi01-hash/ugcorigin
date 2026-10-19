import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccess, isReadonly, type AdminRole, type Section, type AdminContext } from "./roles";

// Re-export the pure model so existing server imports from "@/lib/admin/rbac"
// keep working. Client components should import from "@/lib/admin/roles".
export {
  ROLES,
  ROLE_LABEL,
  canAccess,
  isReadonly,
  sectionsFor,
  type AdminRole,
  type Section,
  type AdminContext,
} from "./roles";

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
