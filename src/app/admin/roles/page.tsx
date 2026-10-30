import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminShellSkeleton } from "@/components/admin/admin-shell-skeleton";
import { RolesManager, type AdminRow } from "@/components/admin/roles-manager";
import { AdminListControls } from "@/components/admin/list-controls";
import { requireSection, type AdminRole } from "@/lib/admin/rbac";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_PAGE_SIZE, pageCount, readPage, readQuery } from "@/lib/admin/list";
import { ROLE_LABEL } from "@/lib/admin/roles";

export const metadata: Metadata = { title: "Admin · Roles" };

async function RolesInner({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { role, userId } = await requireSection("roles");
  const sp = await searchParams;
  const q = readQuery(sp.q).toLowerCase();
  const roleFilter = sp.role && sp.role in ROLE_LABEL ? sp.role : "all";
  const page = readPage(sp.page);
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
  })).filter((row) => (roleFilter === "all" || row.role === roleFilter) && (!q || row.email.toLowerCase().includes(q) || row.role.includes(q)));
  const pages = pageCount(rows.length);
  const visible = rows.slice((Math.min(page, pages) - 1) * ADMIN_PAGE_SIZE, Math.min(page, pages) * ADMIN_PAGE_SIZE);

  return (
    <AdminShell role={role} active="roles">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Roles & access</h1>
      <p className="mt-1.5 text-sm text-ink-2">Who can do what in the admin. Each role sees only its sections.</p>
      <AdminListControls
        pathname="/admin/roles"
        q={q}
        placeholder="Email"
        filters={[{ name: "role", label: "Role", value: roleFilter, options: [{ value: "all", label: "All roles" }, ...Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }))] }]}
        page={Math.min(page, pages)}
        pages={pages}
        total={rows.length}
      />
      <div className="mt-6">
        <RolesManager rows={visible} meId={userId} />
      </div>
    </AdminShell>
  );
}

export default function AdminRolesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return (
    <Suspense fallback={<AdminShellSkeleton />}>
      <RolesInner searchParams={searchParams} />
    </Suspense>
  );
}
