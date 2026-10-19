"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Video, Users, Check, X, Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field, Select } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { proposeMeeting, respondToMeeting } from "@/app/gigs/meeting-actions";

export type Meeting = {
  id: string;
  kind: "call" | "focus_group";
  title: string;
  scheduled_at: string;
  link: string | null;
  notes: string | null;
  status: "proposed" | "confirmed" | "declined" | "cancelled";
  proposed_by: string;
};

const STATUS_STYLE: Record<string, string> = {
  proposed: "bg-warning/14 text-warning",
  confirmed: "bg-success/14 text-success",
  declined: "bg-error/12 text-error",
  cancelled: "bg-surface-2 text-ink-3",
};

export function MeetingScheduler({ gigId, currentUserId, meetings }: { gigId: string; currentUserId: string; meetings: Meeting[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"call" | "focus_group">("call");
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function propose() {
    setErr(null);
    start(async () => {
      const r = await proposeMeeting({ gigId, kind, title, scheduledAt: when ? new Date(when).toISOString() : "", link, notes });
      if (r.error) setErr(r.error);
      else {
        setOpen(false);
        setTitle("");
        setWhen("");
        setLink("");
        setNotes("");
        router.refresh();
      }
    });
  }

  function respond(id: string, status: "confirmed" | "declined" | "cancelled") {
    setErr(null);
    start(async () => {
      const r = await respondToMeeting(id, status);
      if (r.error) setErr(r.error);
      else router.refresh();
    });
  }

  return (
    <Card className="mb-6">
      <CardBody>
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 font-semibold text-ink">
            <CalendarClock className="size-4 text-accent" /> Meetings &amp; focus groups
          </p>
          {!open && (
            <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
              <Plus className="size-4" /> Schedule
            </Button>
          )}
        </div>

        {open && (
          <div className="mt-4 grid gap-3">
            <Field label="Type">
              <Select value={kind} onChange={(e) => setKind(e.target.value as "call" | "focus_group")}>
                <option value="call">1:1 call</option>
                <option value="focus_group">Focus group</option>
              </Select>
            </Field>
            <Field label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "focus_group" ? "Product feedback session" : "Kickoff call"} />
            </Field>
            <Field label="Date & time">
              <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
            </Field>
            <Field label="Meeting link" hint="Zoom, Google Meet, etc. (optional)">
              <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://meet.google.com/…" />
            </Field>
            <Field label="Notes" hint="Optional">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Agenda, who should join, prep…" className="min-h-16" />
            </Field>
            {err && <p className="text-sm text-error">{err}</p>}
            <div className="flex gap-2">
              <Button onClick={propose} loading={pending} disabled={!title.trim() || !when}>Propose</Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {meetings.length > 0 && (
          <ul className="mt-4 space-y-2">
            {meetings.map((m) => {
              const mine = m.proposed_by === currentUserId;
              const Icon = m.kind === "focus_group" ? Users : Video;
              return (
                <li key={m.id} className="rounded-xl border border-line bg-surface p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 font-medium text-ink">
                        <Icon className="size-4 text-ink-3" /> {m.title}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-3">
                        {new Date(m.scheduled_at).toLocaleString()} · {m.kind === "focus_group" ? "Focus group" : "Call"}
                      </p>
                      {m.notes && <p className="mt-1 text-sm text-ink-2">{m.notes}</p>}
                      {m.link && m.status === "confirmed" && (
                        <a href={m.link} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                          Join <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize", STATUS_STYLE[m.status])}>{m.status}</span>
                  </div>

                  {m.status === "proposed" && (
                    <div className="mt-2 flex gap-2">
                      {mine ? (
                        <button disabled={pending} onClick={() => respond(m.id, "cancelled")} className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs text-ink-2 hover:text-ink">
                          <X className="size-3.5" /> Cancel
                        </button>
                      ) : (
                        <>
                          <button disabled={pending} onClick={() => respond(m.id, "confirmed")} className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent-tint px-3 py-1 text-xs font-medium text-accent-hover">
                            <Check className="size-3.5" /> Confirm
                          </button>
                          <button disabled={pending} onClick={() => respond(m.id, "declined")} className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs text-ink-2 hover:text-ink">
                            <X className="size-3.5" /> Decline
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {err && !open && <p className="mt-2 text-sm text-error">{err}</p>}
      </CardBody>
    </Card>
  );
}
