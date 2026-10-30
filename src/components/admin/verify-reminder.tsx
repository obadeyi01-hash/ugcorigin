"use client";

import { useState, useTransition } from "react";
import { Bell, Send, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { adminSendVerifyReminder } from "@/app/admin/actions";

/**
 * Per-user "nudge them to verify" control for the verification console. The
 * admin sends the default branded verify email, or unticks it to write a custom
 * message for this one send. Server refuses to remind an already-done account.
 */
export function VerifyReminder({
  userId,
  role,
  readonly,
}: {
  userId: string;
  role: "creator" | "brand";
  readonly: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [useDefault, setUseDefault] = useState(true);
  const [message, setMessage] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (readonly) return null;

  function send() {
    setErr(null);
    setDone(null);
    const custom = useDefault ? "" : message.trim();
    if (!useDefault && !custom) {
      setErr("Write a message, or switch to the default email.");
      return;
    }
    start(async () => {
      const res = await adminSendVerifyReminder({ userId, role, message: custom });
      if (res.error) setErr(res.error);
      else {
        setDone(res.emailed ? "Reminder sent, in-app and email." : "Reminder posted in-app (email isn't configured).");
        setMessage("");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-2 hover:text-accent"
      >
        <Bell className="size-3.5" /> Send a reminder
      </button>
    );
  }

  return (
    <div className="mt-3 w-full rounded-xl border border-line bg-surface-2 p-3">
      <label className="flex items-center gap-2 text-sm text-ink-2">
        <input
          type="checkbox"
          checked={useDefault}
          onChange={(e) => setUseDefault(e.target.checked)}
          className="size-4 accent-accent"
        />
        Use the default verification email
      </label>
      {!useDefault && (
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a short, personal note. It goes out as a branded email with a button to verify."
          rows={4}
          maxLength={2000}
          className="mt-2"
        />
      )}
      {err && <p className="mt-2 flex items-center gap-1.5 text-xs text-error"><AlertCircle className="size-3.5 shrink-0" /> {err}</p>}
      {done && <p className="mt-2 flex items-center gap-1.5 text-xs text-success"><Check className="size-3.5" /> {done}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        <Button size="sm" loading={pending} onClick={send}>
          <Send className="size-4" /> Send reminder
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setErr(null); setDone(null); }}>
          Close
        </Button>
      </div>
    </div>
  );
}
