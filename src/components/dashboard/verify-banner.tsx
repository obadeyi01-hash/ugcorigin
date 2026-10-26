"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resendVerifyPrompt } from "@/app/dashboard/actions";

export function VerifyBanner({
  role,
  href,
  title,
  body,
}: {
  role: "creator" | "brand";
  href: string;
  title: string;
  body: string;
}) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState<string | null>(null);

  return (
    <div className="mt-6 max-w-2xl rounded-2xl border border-warning/30 bg-warning/10 px-4 py-4">
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm text-ink-2">{body}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link href={href}>
          <Button size="sm">
            {role === "creator" ? "Continue verification" : "Verify your brand"} <ArrowRight className="size-4" />
          </Button>
        </Link>
        <Button
          size="sm"
          variant="secondary"
          loading={pending}
          onClick={() => {
            setNote(null);
            start(async () => {
              const res = await resendVerifyPrompt(role);
              if (res.error) setNote(res.error);
              else setNote(res.sent ? "Sent. Check your inbox." : "We already emailed you today. The link in that message still works.");
            });
          }}
        >
          Email me the steps
        </Button>
      </div>
      {note && <p className="mt-2 text-xs text-ink-2">{note}</p>}
    </div>
  );
}
