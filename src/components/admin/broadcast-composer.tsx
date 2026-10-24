"use client";

import { useState, useTransition } from "react";
import { Megaphone, Users, Send, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import {
  previewAudience,
  sendBroadcast,
  BROADCAST_CATEGORIES,
  type Audience,
  type BroadcastInput,
} from "@/app/admin/notifications/actions";

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: "all_creators", label: "All creators" },
  { value: "all_brands", label: "All brands" },
  { value: "all_users", label: "Everyone" },
  { value: "user", label: "A specific person" },
];

const TIERS = ["origin", "rising", "pro", "elite", "signature"];
const BRAND_STATUSES = ["unverified", "pending", "verified"];

export function BroadcastComposer() {
  const [form, setForm] = useState<BroadcastInput>({
    audience: "all_creators",
    identifier: "",
    tier: "",
    liveOnly: false,
    verifiedOnly: false,
    niche: "",
    region: "",
    brandVerification: "",
    title: "",
    body: "",
    href: "",
    category: "announcement",
    sendEmail: true,
    emailSubject: "",
    ctaLabel: "",
  });
  const [count, setCount] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<{ recipients: number; notified: number; emailed: number } | null>(null);
  const [checking, startCheck] = useTransition();
  const [sending, startSend] = useTransition();

  function set<K extends keyof BroadcastInput>(key: K, val: BroadcastInput[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    setCount(null); // audience changed — force a re-check before sending
    setDone(null);
  }

  function check() {
    setErr(null);
    setDone(null);
    startCheck(async () => {
      const r = await previewAudience(form);
      if (r.error) setErr(r.error);
      else setCount(r.count ?? 0);
    });
  }

  function send() {
    setErr(null);
    if (count === null) return;
    if (!window.confirm(`Send this to ${count} ${count === 1 ? "person" : "people"}${form.sendEmail ? " (in-app + email)" : " (in-app only)"}?`)) return;
    startSend(async () => {
      const r = await sendBroadcast(form);
      if (r.error) setErr(r.error);
      else if (r.result) {
        setDone(r.result);
        setCount(null);
      }
    });
  }

  const canCompose = form.title.trim() && form.body.trim();
  const cat = BROADCAST_CATEGORIES.find((c) => c.value === form.category);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      {/* Audience */}
      <Card>
        <CardBody className="grid gap-4">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-accent" />
            <p className="font-semibold text-ink">Audience</p>
          </div>

          <Field label="Who should this reach?">
            <Select value={form.audience} onChange={(e) => set("audience", e.target.value as Audience)}>
              {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </Select>
          </Field>

          {form.audience === "user" && (
            <Field label="Handle or email" hint="e.g. @ada or ada@brand.com">
              <Input value={form.identifier} onChange={(e) => set("identifier", e.target.value)} placeholder="@handle or email" />
            </Field>
          )}

          {form.audience === "all_creators" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tier" hint="Any tier if blank">
                <Select value={form.tier} onChange={(e) => set("tier", e.target.value)}>
                  <option value="">Any tier</option>
                  {TIERS.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
                </Select>
              </Field>
              <Field label="Niche" hint="Exact niche tag, optional">
                <Input value={form.niche} onChange={(e) => set("niche", e.target.value)} placeholder="e.g. beauty" />
              </Field>
              <Field label="Region" hint="Matches location, optional">
                <Input value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="e.g. Lagos" />
              </Field>
              <div className="flex flex-col justify-end gap-2 pb-1">
                <label className="flex items-center gap-2 text-sm text-ink-2">
                  <input type="checkbox" checked={form.liveOnly} onChange={(e) => set("liveOnly", e.target.checked)} className="size-4 accent-accent" />
                  Live profiles only
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-2">
                  <input type="checkbox" checked={form.verifiedOnly} onChange={(e) => set("verifiedOnly", e.target.checked)} className="size-4 accent-accent" />
                  Identity-verified only
                </label>
              </div>
            </div>
          )}

          {form.audience === "all_brands" && (
            <Field label="Verification status" hint="Any status if blank">
              <Select value={form.brandVerification} onChange={(e) => set("brandVerification", e.target.value)}>
                <option value="">Any status</option>
                {BRAND_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
              </Select>
            </Field>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <Button variant="secondary" size="sm" onClick={check} loading={checking}>
              Check audience
            </Button>
            {count !== null && (
              <span className="text-sm font-medium text-ink-2">
                {count === 0 ? "Matches nobody." : `Reaches ${count} ${count === 1 ? "person" : "people"}.`}
              </span>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Message */}
      <Card>
        <CardBody className="grid gap-4">
          <div className="flex items-center gap-2">
            <Megaphone className="size-4 text-accent" />
            <p className="font-semibold text-ink">Message</p>
          </div>

          <Field label="Title">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="New payouts are faster ⚡" maxLength={120} />
          </Field>
          <Field label="Body">
            <Textarea value={form.body} onChange={(e) => set("body", e.target.value)} placeholder="Tell them what's new and why it matters…" rows={4} maxLength={600} />
          </Field>
          <Field label="Link (optional)" hint="Where the CTA / notification points">
            <Input value={form.href} onChange={(e) => set("href", e.target.value)} placeholder="/pro or https://…" />
          </Field>

          <Field label="Category">
            <Select value={form.category} onChange={(e) => set("category", e.target.value)}>
              {BROADCAST_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
          </Field>
          {cat && <p className="-mt-2 text-xs text-ink-3">{cat.note}</p>}

          <label className="flex items-center gap-2 text-sm text-ink-2">
            <input type="checkbox" checked={form.sendEmail} onChange={(e) => set("sendEmail", e.target.checked)} className="size-4 accent-accent" />
            Also send an email
          </label>

          {err && (
            <p className="flex items-center gap-1.5 text-sm text-error"><AlertCircle className="size-4 shrink-0" /> {err}</p>
          )}

          {done ? (
            <div className="rounded-xl border border-success/30 bg-success/5 p-3 text-sm text-ink-2">
              <p className="flex items-center gap-1.5 font-medium text-success"><Check className="size-4" /> Sent.</p>
              <p className="mt-1">{done.notified} in-app · {done.emailed} emails · {done.recipients} targeted.</p>
            </div>
          ) : (
            <Button
              onClick={send}
              loading={sending}
              disabled={!canCompose || count === null || count === 0}
            >
              <Send className="size-4" />
              {count !== null && count > 0 ? `Send to ${count}` : "Check audience first"}
            </Button>
          )}
          {!done && count === null && canCompose && (
            <p className="-mt-2 text-xs text-ink-3">Check the audience before sending.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
