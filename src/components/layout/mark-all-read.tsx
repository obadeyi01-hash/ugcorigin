"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function MarkAllRead({ userId }: { userId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="secondary"
      loading={pending}
      onClick={() =>
        start(async () => {
          const supabase = createClient();
          await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
          router.refresh();
        })
      }
    >
      <CheckCheck className="size-4" /> Mark all read
    </Button>
  );
}
