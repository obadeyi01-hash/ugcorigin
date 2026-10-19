import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardBody } from "@/components/ui/card";
import { ReportActions } from "@/components/admin/report-actions";
import { requireSection, isReadonly } from "@/lib/admin/rbac";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin · Moderation" };

type TargetType = "profile" | "review" | "campaign_submission" | "deliverable";
type Report = {
  id: string;
  target_type: TargetType;
  target_id: string;
  reason: string;
  details: string | null;
  status: "open" | "actioned" | "dismissed";
  resolution: string | null;
  created_at: string;
};

const TYPE_LABEL: Record<TargetType, string> = {
  profile: "Profile",
  review: "Review",
  campaign_submission: "Campaign submission",
  deliverable: "Deliverable",
};
const STATUS_STYLE: Record<string, string> = {
  open: "bg-warning/14 text-warning",
  actioned: "bg-error/12 text-error",
  dismissed: "bg-surface-2 text-ink-3",
};

async function ModerationInner() {
  const { role } = await requireSection("moderation");
  const readonly = isReadonly(role);
  const supabase = await createClient();

  const { data } = await supabase
    .from("reports")
    .select("id, target_type, target_id, reason, details, status, resolution, created_at")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(200);
  const reports = (data ?? []) as Report[];

  // Resolve handles for profile targets so we can link to them.
  const profileIds = reports.filter((r) => r.target_type === "profile").map((r) => r.target_id);
  const handles = new Map<string, string>();
  if (profileIds.length) {
    const { data: cs } = await supabase.from("creator_profiles").select("id, handle").in("id", profileIds);
    (cs ?? []).forEach((c) => c.handle && handles.set(c.id, c.handle));
  }

  const openCount = reports.filter((r) => r.status === "open").length;

  // AI / false-media review queue (flagged or unscored-pending).
  const { data: mediaRaw } = await supabase
    .from("media_reviews")
    .select("id, creator_id, media_url, kind, ai_score, status, created_at")
    .in("status", ["flagged", "pending"])
    .order("created_at", { ascending: false })
    .limit(50);
  const mediaReviews = (mediaRaw ?? []) as { id: string; creator_id: string; media_url: string; kind: string; ai_score: number | null; status: string; created_at: string }[];
  const mediaHandles = new Map<string, string>();
  if (mediaReviews.length) {
    const ids = [...new Set(mediaReviews.map((m) => m.creator_id))];
    const { data: cs } = await supabase.from("creator_profiles").select("id, handle").in("id", ids);
    (cs ?? []).forEach((c) => c.handle && mediaHandles.set(c.id, c.handle));
  }

  return (
    <AdminShell role={role} active="moderation">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Moderation</h1>
      <p className="mt-1 text-sm text-ink-2">
        Reported profiles, reviews, campaign submissions and deliverables. <span className="font-medium text-ink">{openCount}</span> open.
      </p>

      {mediaReviews.length > 0 && (
        <Card className="mt-6">
          <CardBody>
            <h2 className="font-display font-semibold text-ink">Media review queue</h2>
            <p className="mt-0.5 text-sm text-ink-3">Possible AI / false media. Scores from the detector, or unscored for manual review.</p>
            <ul className="mt-3 divide-y divide-line">
              {mediaReviews.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <span className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m.status === "flagged" ? "bg-error/12 text-error" : "bg-warning/14 text-warning"}`}>
                      {m.ai_score != null ? `${m.ai_score}% AI` : "unscored"}
                    </span>
                    <span className="capitalize text-ink-2">{m.kind}</span>
                    {mediaHandles.get(m.creator_id) && (
                      <Link href={`/${mediaHandles.get(m.creator_id)}`} className="text-accent hover:underline">@{mediaHandles.get(m.creator_id)}</Link>
                    )}
                  </span>
                  <a href={m.media_url} target="_blank" rel="noopener noreferrer" className="text-xs text-ink-3 hover:text-ink">open media</a>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <Card className="mt-6">
        <CardBody className="p-0">
          <ul className="divide-y divide-line">
            {reports.map((r) => {
              const handle = handles.get(r.target_id);
              const link =
                r.target_type === "profile" && handle ? `/${handle}` : null;
              return (
                <li key={r.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-ink-2">{TYPE_LABEL[r.target_type]}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                        <span className="text-sm font-semibold text-ink">{r.reason}</span>
                      </div>
                      {r.details && <p className="mt-1 max-w-2xl text-sm text-ink-2">{r.details}</p>}
                      <p className="mt-1 text-xs text-ink-3">
                        {new Date(r.created_at).toLocaleString()}
                        {link ? (
                          <> · <Link href={link} className="text-accent hover:underline">view @{handle}</Link></>
                        ) : (
                          <> · {r.target_id.slice(0, 8)}</>
                        )}
                        {r.resolution && <> · <span className="text-ink-2">{r.resolution}</span></>}
                      </p>
                    </div>
                    {!readonly && r.status === "open" && <ReportActions reportId={r.id} targetType={r.target_type} targetId={r.target_id} />}
                  </div>
                </li>
              );
            })}
            {reports.length === 0 && <li className="p-6 text-center text-sm text-ink-3">No reports. All clear.</li>}
          </ul>
        </CardBody>
      </Card>
    </AdminShell>
  );
}

export default function AdminModerationPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <ModerationInner />
    </Suspense>
  );
}
