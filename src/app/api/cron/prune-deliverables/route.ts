import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { destroyAsset } from "@/lib/cloudinary-server";

// Scheduled cleanup: reclaim Cloudinary storage from deliverables that are no
// longer needed. Safe to run often (idempotent). Protect with CRON_SECRET.
// Vercel Cron sends Authorization: Bearer <CRON_SECRET>. An unset secret
// fails closed. The query-string form is not accepted.
//
// We prune, only after a grace window past the gig's last update:
//   - every deliverable of a cancelled/declined gig
//   - superseded draft versions of a finished gig (status != 'approved')
// The final approved deliverable of a completed gig is always kept — the brand
// paid for it.

const GRACE_DAYS = 14;
const FINISHED = ["approved", "released", "completed"];
const DEAD = ["cancelled", "declined"];

function cronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const got = Buffer.from(header);
  const want = Buffer.from(expected);
  if (got.length !== want.length) return false;
  return timingSafeEqual(got, want);
}

export async function GET(req: Request) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - GRACE_DAYS * 86_400_000).toISOString();

  const { data: rows, error } = await admin
    .from("deliverables")
    .select("id, file_url, status, gig:gigs!inner(status, updated_at)")
    .eq("pruned", false)
    .not("file_url", "is", null)
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let pruned = 0;
  let skipped = 0;
  for (const d of rows ?? []) {
    const gig = (Array.isArray(d.gig) ? d.gig[0] : d.gig) as { status: string; updated_at: string } | null;
    if (!gig) continue;
    if (gig.updated_at > cutoff) continue; // still within the grace window

    const supersededDraft = FINISHED.includes(gig.status) && d.status !== "approved";
    const dead = DEAD.includes(gig.status);
    if (!supersededDraft && !dead) continue;

    // Only Cloudinary refs are handled here; legacy Supabase paths are left alone.
    if (!d.file_url?.startsWith("cld:")) {
      skipped++;
      continue;
    }
    const ok = await destroyAsset(d.file_url);
    if (ok) {
      await admin.from("deliverables").update({ pruned: true }).eq("id", d.id);
      pruned++;
    } else {
      skipped++;
    }
  }

  return NextResponse.json({ ok: true, scanned: rows?.length ?? 0, pruned, skipped });
}
