"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { ROLES, ROLE_LABEL, type AdminRole } from "@/lib/admin/roles";
import { adminAddAdmin, adminSetRole, adminRemoveAdmin } from "@/app/admin/actions";

export type AdminRow = { userId: string; role: AdminRole; email: string };

export function RolesManager({ rows, meId }: { rows: AdminRow[]; meId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("support");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function add() {
    setErr(null);
    start(async () => {
      const r = await adminAddAdmin(email, role);
      if (r.error) setErr(r.error);
      else { setEmail(""); router.refresh(); }
    });
  }

  return (
    <div className="grid gap-5">
      <Card>
        <CardBody>
          <p className="font-semibold text-ink">Add an admin</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_180px_auto]">
            <Input type="email" placeholder="their@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Select value={role} onChange={(e) => setRole(e.target.value as AdminRole)}>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </Select>
            <Button onClick={add} loading={pending} disabled={!email.trim()}>Add</Button>
          </div>
          {err && <p className="mt-2 text-sm text-error">{err}</p>}
          <p className="mt-2 text-xs text-ink-3">They must have signed up first. Roles control which admin sections they can use.</p>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <li key={r.userId} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{r.email || r.userId}</p>
                  {r.userId === meId && <p className="text-xs text-accent">You</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    defaultValue={r.role}
                    onChange={(e) => start(async () => { await adminSetRole(r.userId, e.target.value as AdminRole); router.refresh(); })}
                    className="w-40"
                  >
                    {ROLES.map((role) => <option key={role} value={role}>{ROLE_LABEL[role]}</option>)}
                  </Select>
                  {r.userId !== meId && (
                    <button
                      onClick={() => start(async () => { await adminRemoveAdmin(r.userId); router.refresh(); })}
                      className="u-press grid size-9 place-items-center rounded-full text-ink-3 hover:bg-error/10 hover:text-error"
                      aria-label="Remove admin"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
