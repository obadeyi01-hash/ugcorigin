import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Append an immutable audit-log entry for a privileged admin action. Best-effort
 * on the write itself (a logging failure must never block the action it records),
 * but every money / role / verification action should call it so the trail shows
 * who did what, to whom, and when — and where a lapse happened.
 */
export async function logAudit(
  admin: Admin,
  actorId: string | null,
  action: string,
  opts?: {
    targetType?: string;
    targetId?: string | null;
    before?: unknown;
    after?: unknown;
  },
): Promise<void> {
  try {
    await admin.from("audit_log").insert({
      actor_id: actorId,
      action,
      target_type: opts?.targetType ?? null,
      target_id: opts?.targetId ?? null,
      before: opts?.before ?? null,
      after: opts?.after ?? null,
    });
  } catch {
    /* never block the action on an audit write */
  }
}
