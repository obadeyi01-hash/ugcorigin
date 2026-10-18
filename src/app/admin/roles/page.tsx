import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { RolesManager, type AdminRow } from "@/components/admin/roles-manager";
import { requireSection, type AdminRole } from "@/lib/admin/rbac";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin · Roles" };

async function RolesInner() {
  const { role, userId } = await requireSection("roles");
  const supabase = await createClient();

  const { data: admins } = await supabase.from("admin_users").select("user_id, role").order("created_at", { ascending: true });
  const ids = (admins ?? []).map((a) => a.user_id);
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("id, email").in("id", ids)
    : { data: [] as { id: string; email: string | null }[] };
  const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email ?? ""]));

  const rows: AdminRow[] = (admins ?? []).map((a) => ({
    userId: a.user_id,
    role: a.role as AdminRole,
    email: emailById.get(a.user_id) ?? "",
  }));

  return (
    <AdminShell role={role} active="roles">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Roles & access</h1>
      <p className="mt-1.5 text-sm text-ink-2">Who can do what in the admin. Each role sees only its sections.</p>
      <div className="mt-6">
        <RolesManager rows={rows} meId={userId} />
      </div>
    </AdminShell>
  );
}

export default function AdminRolesPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <RolesInner />
    </Suspense>
  );
}
