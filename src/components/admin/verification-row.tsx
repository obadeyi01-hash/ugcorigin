"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { adminSetIdentityVerified, adminSetLive } from "@/app/admin/actions";

export function VerificationRow({
  id,
  identityVerified,
  isLive,
  readonly,
}: {
  id: string;
  identityVerified: boolean;
  isLive: boolean;
  readonly: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ error?: string }>) {
    start(async () => {
      await fn();
      router.refresh();
    });
  }

  if (readonly) return <span className="text-xs text-ink-3">Read-only</span>;

  return (
    <div className="flex flex-wrap gap-2">
      {!identityVerified && (
        <Button size="sm" loading={pending} onClick={() => run(() => adminSetIdentityVerified(id, true))}>
          Verify identity
        </Button>
      )}
      {identityVerified && !isLive && (
        <Button size="sm" variant="secondary" loading={pending} onClick={() => run(() => adminSetLive(id, true))}>
          Set live
        </Button>
      )}
      {isLive && (
        <Button size="sm" variant="ghost" loading={pending} onClick={() => run(() => adminSetLive(id, false))}>
          Unpublish
        </Button>
      )}
    </div>
  );
}
