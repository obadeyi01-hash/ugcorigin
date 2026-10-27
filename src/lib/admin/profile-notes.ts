import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

export async function recordProfileNote(
  admin: Admin,
  row: {
    userId: string;
    kind: "placement" | "identity_rejection" | "brand_rejection";
    subject: string;
    body: string;
    actorId?: string | null;
  },
) {
  await admin.from("profile_notes").insert({
    user_id: row.userId,
    kind: row.kind,
    subject: row.subject.slice(0, 200),
    body: row.body.slice(0, 4000),
    actor_id: row.actorId ?? null,
  });
}
