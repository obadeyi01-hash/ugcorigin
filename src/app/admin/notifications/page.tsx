import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminContentSkeleton } from "@/components/ui/skeleton";
import { Card, CardBody } from "@/components/ui/card";
import { BroadcastComposer } from "@/components/admin/broadcast-composer";
import { requireSection, isReadonly } from "@/lib/admin/rbac";

export const metadata: Metadata = { title: "Admin · Notifications" };

async function NotificationsInner() {
  const { role } = await requireSection("comms");
  const readonly = isReadonly(role);

  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Send a notification</h1>
      <p className="mt-1.5 text-sm text-ink-2">
        Compose an in-app notification (and optional email) and send it to a targeted audience. Every send is recorded in the audit log.
      </p>

      <div className="mt-6">
        {readonly ? (
          <Card variant="outline"><CardBody className="py-10 text-center text-ink-2">Your role is read-only.</CardBody></Card>
        ) : (
          <BroadcastComposer />
        )}
      </div>
    </>
  );
}

export default function AdminNotificationsPage() {
  return (
    <Suspense fallback={<AdminContentSkeleton />}>
      <NotificationsInner />
    </Suspense>
  );
}
