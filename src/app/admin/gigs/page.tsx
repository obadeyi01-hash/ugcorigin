import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AdminContentSkeleton } from "@/components/ui/skeleton";
import { Card, CardBody } from "@/components/ui/card";
import { AdminListControls } from "@/components/admin/list-controls";
import { requireSection } from "@/lib/admin/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadBriefApplications } from "@/lib/briefs/applicants";
import type { AppRow } from "@/components/briefs/applications-list";
import { formatNaira } from "@/lib/utils";
import { pageCount, pageWindow, readPage, readQuery } from "@/lib/admin/list";

export const metadata: Metadata = { title: "Admin · Gigs" };

const KINDS = [
  { value: "briefs", label: "Posted briefs" },
  { value: "campaigns", label: "Pay-per-view" },
  { value: "hired", label: "Hired contracts" },
] as const;

type Kind = (typeof KINDS)[number]["value"];

const BRIEF_STATUS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "draft", label: "Draft" },
  { value: "closed", label: "Closed" },
  { value: "filled", label: "Filled" },
];

const CAMPAIGN_STATUS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "draft", label: "Draft" },
  { value: "closed", label: "Closed" },
  { value: "completed", label: "Completed" },
];

const HIRED_STATUS = [
  { value: "all", label: "All" },
  { value: "pending_acceptance", label: "Pending acceptance" },
  { value: "funded", label: "Funded" },
  { value: "in_progress", label: "In progress" },
  { value: "in_review", label: "In review" },
  { value: "revision", label: "Revision" },
  { value: "approved", label: "Approved" },
  { value: "released", label: "Released" },
  { value: "completed", label: "Completed" },
  { value: "disputed", label: "Disputed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "declined", label: "Declined" },
];

function readKind(raw: string | undefined): Kind {
  return KINDS.some((item) => item.value === raw) ? (raw as Kind) : "briefs";
}

function readStatus(raw: string | undefined, options: { value: string }[]) {
  return options.some((item) => item.value === raw) ? raw! : "all";
}

function embedCount(value: unknown): number {
  const row = Array.isArray(value) ? value[0] : value;
  if (row && typeof row === "object" && "count" in row) {
    const n = Number((row as { count: unknown }).count);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

type ApplicantLine = { key: string; name: string; href: string; detail: string; messageHref: string | null; gigHref: string | null };

type GigRow = {
  id: string;
  href: string;
  title: string;
  meta: string;
  amount: string;
  badge: string;
  applicants: ApplicantLine[];
};

async function GigsInner({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireSection("gigs");
  const admin = createAdminClient();
  const sp = await searchParams;
  const kind = readKind(sp.kind);
  const q = readQuery(sp.q);
  const statusOptions = kind === "campaigns" ? CAMPAIGN_STATUS : kind === "hired" ? HIRED_STATUS : BRIEF_STATUS;
  const status = readStatus(sp.status, statusOptions);
  const applicantsOnly = kind === "briefs" && sp.who === "applied";
  const page = readPage(sp.page);
  const window = pageWindow(page);

  let rows: GigRow[] = [];
  let count = 0;

  if (kind === "briefs") {
    let appliedIds: string[] | null = null;
    if (applicantsOnly) {
      const { data: hits } = await admin.from("applications").select("brief_id");
      appliedIds = [...new Set((hits ?? []).map((row) => row.brief_id))];
    }
    let query = admin
      .from("briefs")
      .select("id, brand_id, title, status, budget_naira, slots, deadline, location, in_house, applications(count)", { count: "exact" })
      .order("created_at", { ascending: false });
    if (q) query = query.ilike("title", `%${q}%`);
    if (status !== "all") query = query.eq("status", status);
    if (appliedIds) query = appliedIds.length ? query.in("id", appliedIds) : query.eq("id", "00000000-0000-0000-0000-000000000000");
    const { data, count: total } = await query.range(window.from, window.to);
    count = total ?? 0;
    const pageRows = data ?? [];
    const byBrand = new Map<string, string[]>();
    for (const row of pageRows) {
      const list = byBrand.get(row.brand_id) ?? [];
      list.push(row.id);
      byBrand.set(row.brand_id, list);
    }
    const appsByBrief = new Map<string, AppRow[]>();
    await Promise.all(
      [...byBrand.entries()].map(async ([brandId, ids]) => {
        const loaded = await loadBriefApplications(ids, brandId, "admin");
        for (const [briefId, apps] of loaded) appsByBrief.set(briefId, apps);
      }),
    );
    rows = pageRows.map((row) => {
      const applied = embedCount(row.applications);
      const where = [row.location, row.deadline ? `due ${row.deadline}` : null, row.in_house ? "in-house" : null].filter(Boolean).join(" · ");
      const applicants = (appsByBrief.get(row.id) ?? []).map((app) => ({
        key: app.id,
        name: app.creatorHandle ? `${app.creatorName} (@${app.creatorHandle})` : app.creatorName,
        href: app.creatorHandle ? `/${app.creatorHandle}` : `/briefs/${row.id}`,
        detail: [app.status === "selected" ? "accepted" : app.status, app.location].filter(Boolean).join(" · "),
        messageHref: app.messageHref ?? null,
        gigHref: app.gigHref ?? null,
      }));
      return {
        id: row.id,
        href: `/briefs/${row.id}`,
        title: row.title,
        meta: `${where ? `${where} · ` : ""}${applied} applied · need ${row.slots}`,
        amount: row.budget_naira ? formatNaira(row.budget_naira) : "Open",
        badge: row.status,
        applicants,
      };
    });
  } else if (kind === "campaigns") {
    let query = admin
      .from("campaigns")
      .select("id, title, status, funded, pool_naira, spent_naira, rate_per_1000_naira, campaign_submissions(count)", { count: "exact" })
      .order("created_at", { ascending: false });
    if (q) query = query.ilike("title", `%${q}%`);
    if (status !== "all") query = query.eq("status", status);
    const { data, count: total } = await query.range(window.from, window.to);
    count = total ?? 0;
    rows = (data ?? []).map((row) => {
      const submitted = embedCount(row.campaign_submissions);
      const left = row.pool_naira - row.spent_naira;
      return {
        id: row.id,
        href: `/campaigns/${row.id}`,
        title: row.title,
        meta: `${formatNaira(row.rate_per_1000_naira)} / 1k · ${formatNaira(left)} left · ${submitted} submitted${row.funded ? "" : " · pool not funded"}`,
        amount: formatNaira(row.pool_naira),
        badge: row.status,
        applicants: [],
      };
    });
  } else {
    let query = admin
      .from("gigs")
      .select("id, title, status, price_naira, brand_id, creator_id, created_at", { count: "exact" })
      .order("created_at", { ascending: false });
    if (q) query = query.ilike("title", `%${q}%`);
    if (status !== "all") query = query.eq("status", status);
    const { data, count: total } = await query.range(window.from, window.to);
    count = total ?? 0;
    const hired = data ?? [];
    const creatorIds = [...new Set(hired.map((row) => row.creator_id))];
    const brandIds = [...new Set(hired.map((row) => row.brand_id))];
    const [{ data: creators }, { data: brands }, { data: convs }] = await Promise.all([
      creatorIds.length
        ? admin.from("creator_profiles").select("id, display_name, handle").in("id", creatorIds)
        : Promise.resolve({ data: [] as { id: string; display_name: string | null; handle: string | null }[] }),
      brandIds.length
        ? admin.from("brand_profiles").select("id, company_name").in("id", brandIds)
        : Promise.resolve({ data: [] as { id: string; company_name: string | null }[] }),
      creatorIds.length
        ? admin.from("conversations").select("id, brand_id, creator_id").in("creator_id", creatorIds)
        : Promise.resolve({ data: [] as { id: string; brand_id: string; creator_id: string }[] }),
    ]);
    const creatorName = new Map((creators ?? []).map((row) => [row.id, row.display_name || (row.handle ? `@${row.handle}` : "Creator")]));
    const brandName = new Map((brands ?? []).map((row) => [row.id, row.company_name || "Brand"]));
    const convoKey = (brandId: string, creatorId: string) => `${brandId}:${creatorId}`;
    const convoByPair = new Map((convs ?? []).map((row) => [convoKey(row.brand_id, row.creator_id), row.id]));
    rows = hired.map((row) => {
      const conversationId = convoByPair.get(convoKey(row.brand_id, row.creator_id)) ?? null;
      return {
        id: row.id,
        href: `/gigs/${row.id}`,
        title: row.title,
        meta: `${brandName.get(row.brand_id) ?? "Brand"} · ${creatorName.get(row.creator_id) ?? "Creator"}`,
        amount: formatNaira(row.price_naira),
        badge: row.status.replaceAll("_", " "),
        applicants: [
          {
            key: row.creator_id,
            name: creatorName.get(row.creator_id) ?? "Creator",
            href: `/gigs/${row.id}`,
            detail: "hired",
            messageHref: conversationId ? `/admin/messages?c=${conversationId}` : null,
            gigHref: null,
          },
        ],
      };
    });
  }

  const pages = pageCount(count);
  const empty =
    kind === "hired"
      ? "No hired contracts yet. An in-house brief starts one when the brand accepts an applicant. A paid brief starts one when the brand funds it."
      : "Nothing matches these filters.";

  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Gigs</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-2">
        Posted briefs, the people who applied, pay-per-view campaigns, and hired contracts. Conversations between a brand and a creator are under Messages.
      </p>
      <AdminListControls
        pathname="/admin/gigs"
        q={q}
        placeholder="Title"
        filters={[
          { name: "kind", label: "Show", value: kind, options: KINDS.map((item) => ({ value: item.value, label: item.label })) },
          { name: "status", label: "Status", value: status, options: statusOptions },
          ...(kind === "briefs"
            ? [{ name: "who", label: "Applicants", value: applicantsOnly ? "applied" : "all", options: [{ value: "all", label: "All briefs" }, { value: "applied", label: "Has applicants" }] }]
            : []),
        ]}
        page={Math.min(page, pages)}
        pages={pages}
        total={count}
      />
      <Card className="mt-4">
        <CardBody className="p-0">
          <ul className="divide-y divide-line">
            {rows.map((row) => (
              <li key={row.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={row.href} className="block truncate font-medium text-ink hover:text-accent">{row.title}</Link>
                    <p className="mt-0.5 truncate text-xs text-ink-3">{row.meta}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm text-ink-2">{row.amount}</span>
                    <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium capitalize text-ink-2">{row.badge}</span>
                  </div>
                </div>
                {row.applicants.length > 0 && (
                  <ul className="mt-3 grid gap-1.5">
                    {row.applicants.map((person) => (
                      <li key={person.key} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <Link href={person.href} className="font-medium text-ink hover:text-accent">{person.name}</Link>
                        <span className="text-xs capitalize text-ink-3">{person.detail}</span>
                        {person.messageHref && (
                          <Link href={person.messageHref} className="text-xs font-medium text-accent hover:underline">Conversation</Link>
                        )}
                        {person.gigHref && (
                          <Link href={person.gigHref} className="text-xs font-medium text-accent hover:underline">Job</Link>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            {rows.length === 0 && <li className="p-6 text-center text-sm text-ink-3">{empty}</li>}
          </ul>
        </CardBody>
      </Card>
    </>
  );
}

export default function AdminGigsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return (
    <Suspense fallback={<AdminContentSkeleton />}>
      <GigsInner searchParams={searchParams} />
    </Suspense>
  );
}
