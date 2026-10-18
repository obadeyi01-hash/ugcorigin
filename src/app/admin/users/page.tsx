import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardBody } from "@/components/ui/card";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { FeaturedToggle } from "@/components/admin/featured-toggle";
import { requireSection, isReadonly } from "@/lib/admin/rbac";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin · Users" };

async function UsersInner() {
  const { role } = await requireSection("users");
  const supabase = await createClient();
  const readonly = isReadonly(role);

  const [{ data: creators }, { data: brands }] = await Promise.all([
    supabase.from("creator_profiles").select("id, handle, display_name, location, is_live, verification_status, featured").order("created_at", { ascending: false }).limit(100),
    supabase.from("brand_profiles").select("id, company_name, website, verification_status").order("created_at", { ascending: false }).limit(100),
  ]);

  return (
    <AdminShell role={role} active="users">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Users</h1>

      <h2 className="mt-6 font-display text-lg font-semibold text-ink">Creators ({creators?.length ?? 0})</h2>
      <Card className="mt-3">
        <CardBody className="p-0">
          <ul className="divide-y divide-line">
            {(creators ?? []).map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <Link href={`/${c.handle}`} className="inline-flex items-center gap-1.5 font-medium text-ink hover:text-accent">
                    {c.display_name || `@${c.handle}`}
                    {c.verification_status === "verified" && <VerifiedBadge compact />}
                  </Link>
                  <p className="text-xs text-ink-3">@{c.handle} · {c.location || "Nigeria"} · {c.is_live ? "Live" : "Not live"}</p>
                </div>
                <FeaturedToggle id={c.id} featured={!!c.featured} readonly={readonly} />
              </li>
            ))}
            {(!creators || creators.length === 0) && <li className="p-6 text-center text-sm text-ink-3">No creators yet.</li>}
          </ul>
        </CardBody>
      </Card>

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">Brands ({brands?.length ?? 0})</h2>
      <Card className="mt-3">
        <CardBody className="p-0">
          <ul className="divide-y divide-line">
            {(brands ?? []).map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{b.company_name || ", "}</p>
                  {b.website && <p className="truncate text-xs text-ink-3">{b.website}</p>}
                </div>
                <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs capitalize text-ink-2">{b.verification_status}</span>
              </li>
            ))}
            {(!brands || brands.length === 0) && <li className="p-6 text-center text-sm text-ink-3">No brands yet.</li>}
          </ul>
        </CardBody>
      </Card>
    </AdminShell>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <UsersInner />
    </Suspense>
  );
}
