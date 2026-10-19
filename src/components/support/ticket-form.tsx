"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field, Select } from "@/components/ui/input";
import { createTicket, type TicketCategory } from "@/app/support/actions";

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: "account", label: "My account" },
  { value: "payment", label: "Payments & payouts" },
  { value: "gig", label: "A gig or offer" },
  { value: "trust_safety", label: "Trust & safety" },
  { value: "bug", label: "Something's broken" },
  { value: "other", label: "Something else" },
];

export function TicketForm() {
  const router = useRouter();
  const [category, setCategory] = useState<TicketCategory>("other");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  function submit() {
    setErr(null);
    start(async () => {
      const r = await createTicket({ category, subject, body });
      if (r.error) setErr(r.error);
      else {
        setDone(true);
        setSubject("");
        setBody("");
        router.refresh();
      }
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/5 p-5">
        <p className="flex items-center gap-2 font-semibold text-ink">
          <Check className="size-4 text-success" /> Ticket sent
        </p>
        <p className="mt-1 text-sm text-ink-2">We&rsquo;ll reply by email and it&rsquo;ll show in your tickets below.</p>
        <Button variant="secondary" className="mt-3" onClick={() => setDone(false)}>Send another</Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <Field label="What's it about?">
        <Select value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </Select>
      </Field>
      <Field label="Subject">
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="A short summary" />
      </Field>
      <Field label="Details">
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Tell us what's happening, with any gig or payment reference if relevant." className="min-h-28" />
      </Field>
      {err && <p className="text-sm text-error">{err}</p>}
      <div>
        <Button onClick={submit} loading={pending} disabled={!subject.trim() || !body.trim()}>Send to support</Button>
      </div>
    </div>
  );
}
