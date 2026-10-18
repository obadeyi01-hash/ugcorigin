"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrCreateConversation } from "@/app/messages/actions";

export function StartConversationButton({
  otherUserId,
  label = "Message",
  variant = "secondary",
  className,
}: {
  otherUserId: string;
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <>
      <Button
        variant={variant}
        className={className}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await getOrCreateConversation(otherUserId);
            if (r.id) router.push(`/messages/${r.id}`);
            else setErr(r.error ?? "Could not open chat.");
          })
        }
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <MessageSquare className="size-4" />} {label}
      </Button>
      {err && <p className="mt-1 text-xs text-error">{err}</p>}
    </>
  );
}
