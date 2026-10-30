import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AdminContentSkeleton } from "@/components/ui/skeleton";
import { Card, CardBody } from "@/components/ui/card";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { FeaturedToggle } from "@/components/admin/featured-toggle";
import { AdminListControls } from "@/components/admin/list-controls";
import { requireSection, isReadonly } from "@/lib/admin/rbac";
import { createClient } from "@/lib/supabase/server";
import { pageCount, pageWindow, readPage, readQuery } from "@/lib/admin/list";

export const metadata: Metadata = { title: "Admin · Users" };

const CREATOR_STATUS = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "hidden", label: "Not live" },
  { value: "verified", label: "Verified" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "unverified", label: "Unverified" },
];
const BRAND_STATUS = [
  { value: "all", label: "All" },
  { value: "verified", label: "Verified" },
  { value: "pending", label: "Pending" },
  { value: "unverified", label: "Unverified" },
];

async function UsersInner({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { role } = await requireSection("users");
  const supabase = await createClient();
  const readonly = isReadonly(role);
  const sp = await searchParams;
  const q = readQuery(sp.q);
  const bq = readQuery(sp.bq);
  const status = CREATOR_STATUS.some((item) => item.value === sp.status) ? sp.status! : "all";
  const bstatus = BRAND_STATUS.some((item) => item.value === sp.bstatus) ? sp.bstatus! : "all";
  const page = readPage(sp.page);
  const bpage = readPage(sp.bpage);
  const creatorsWindow = pageWindow(page);
  const brandsWindow = pageWindow(bpage);

  let creatorsQuery = supabase
    .from("creator_profiles")
    .select("id, handle, display_name, location, is_live, verification_status, featured, avatar_url", { count: "exact" })
    .order("created_at", { ascending: false });
  if (q) creatorsQuery = creatorsQuery.or(`display_name.ilike.%${q}%,handle.ilike.%${q}%,location.ilike.%${q}%`);
  if (status === "live") creatorsQuery = creatorsQuery.eq("is_live", true);
  if (status === "hidden") creatorsQuery = creatorsQuery.eq("is_live", false);
  if (status === "verified" || status === "pending" || status === "rejected" || status === "unverified") {
    creatorsQuery = creatorsQuery.eq("verification_status", status);
  }

  let brandsQuery = supabase
    .from("brand_profiles")
    .select("id, company_name, website, verification_status", { count: "exact" })
    .order("created_at", { ascending: false });
  if (bq) brandsQuery = brandsQuery.or(`company_name.ilike.%${bq}%,website.ilike.%${bq}%`);
  if (bstatus !== "all") brandsQuery = brandsQuery.eq("verification_status", bstatus);

  const [{ data: creators, count: creatorCount }, { data: brands, count: brandCount }] = await Promise.all([
    creatorsQuery.range(creatorsWindow.from, creatorsWindow.to),
    brandsQuery.range(brandsWindow.from, brandsWindow.to),
  ]);
  const creatorPages = pageCount(creatorCount);
  const brandPages = pageCount(brandCount);

  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Users</h1>

      <h2 className="mt-6 font-display text-lg font-semibold text-ink">Creators</h2>
      <AdminListControls
        pathname="/admin/users"
        q={q}
        placeholder="Name, username, location"
        filters={[{ name: "status", label: "Status", value: status, options: CREATOR_STATUS }]}
        page={Math.min(page, creatorPages)}
        pages={creatorPages}
        total={creatorCount ?? 0}
        hidden={{ bq, bpage: bpage > 1 ? String(bpage) : undefined, bstatus: bstatus === "all" ? undefined : bstatus }}
      />
      <Card className="mt-3">
        <CardBody className="p-0">
          <ul className="divide-y divide-line">
            {(creators ?? []).map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  {c.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.avatar_url} alt="" className="size-10 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 text-xs text-ink-3">No photo</span>
                  )}
                  <div className="min-w-0">
                    <Link href={`/admin/users/${c.id}`} className="inline-flex items-center gap-1.5 font-medium text-ink hover:text-accent">
                      {c.display_name || `@${c.handle}`}
                      {c.verification_status === "verified" && <VerifiedBadge compact />}
                    </Link>
                    <p className="text-xs text-ink-3">
                      @{c.handle} · {c.location || "Nigeria"} · {c.is_live ? "Live" : "Not live"}
                      {c.handle && <> · <Link href={`/${c.handle}`} className="hover:text-ink">Public card</Link></>}
                    </p>
                  </div>
                </div>
                <FeaturedToggle id={c.id} featured={!!c.featured} readonly={readonly} />
              </li>
            ))}
            {(!creators || creators.length === 0) && <li className="p-6 text-center text-sm text-ink-3">No creators yet.</li>}
          </ul>
        </CardBody>
      </Card>

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">Brands</h2>
      <AdminListControls
        pathname="/admin/users"
        q={bq}
        queryParam="bq"
        pageParam="bpage"
        placeholder="Company or website"
        filters={[{ name: "bstatus", label: "Status", value: bstatus, options: BRAND_STATUS }]}
        page={Math.min(bpage, brandPages)}
        pages={brandPages}
        total={brandCount ?? 0}
        hidden={{ q, page: page > 1 ? String(page) : undefined, status: status === "all" ? undefined : status }}
      />
      <Card className="mt-3">
        <CardBody className="p-0">
          <ul className="divide-y divide-line">
            {(brands ?? []).map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <Link href={`/admin/users/${b.id}`} className="font-medium text-ink hover:text-accent">{b.company_name || "Unnamed business"}</Link>
                  {b.website && <p className="truncate text-xs text-ink-3">{b.website}</p>}
                </div>
                <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs capitalize text-ink-2">{b.verification_status}</span>
              </li>
            ))}
            {(!brands || brands.length === 0) && <li className="p-6 text-center text-sm text-ink-3">No brands yet.</li>}
          </ul>
        </CardBody>
      </Card>
    </>
  );
}

export default function AdminUsersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return (
    <Suspense fallback={<AdminContentSkeleton />}>
      <UsersInner searchParams={searchParams} />
    </Suspense>
  );
}
