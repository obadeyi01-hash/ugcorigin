"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { submitBrandVerification } from "@/app/brand-verify/actions";

export function BrandVerifyCard({
  status,
  companyName,
  rcNumber,
  note,
}: {
  status: string;
  companyName: string;
  rcNumber: string;
  note?: string | null;
}) {
  const router = useRouter();
  const [company, setCompany] = useState(companyName);
  const [rc, setRc] = useState(rcNumber);
  const [address, setAddress] = useState("");
  const [director, setDirector] = useState("");
  const [directorId, setDirectorId] = useState("");
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (status === "verified") {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardBody>
          <p className="flex items-center gap-2 font-semibold text-ink"><BadgeCheck className="size-4 text-success" /> Verified brand</p>
          <p className="mt-0.5 text-sm text-ink-2">Creators see a Verified brand badge on your offers. Nice.</p>
        </CardBody>
      </Card>
    );
  }

  function submit() {
    setErr(null);
    start(async () => {
      const r = await submitBrandVerification({
        companyName: company,
        rcNumber: rc,
        registeredAddress: address,
        directorName: director,
        directorId,
        consent,
      });
      if (r.error) setErr(r.error);
      else router.refresh();
    });
  }

  return (
    <Card>
      <CardBody>
        <p className="font-semibold text-ink">Business verification</p>
        <p className="mt-0.5 text-sm text-ink-2">
          Verify your business so creators trust you. We check your company name, CAC/RC number, registered address, and the identity of the person responsible for this account.
        </p>
        {status !== "pending" && note?.trim() && (
          <p className="mt-3 rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-ink">
            <span className="font-medium">What we need you to change. </span>{note.trim()}
          </p>
        )}
        {status === "pending" ? (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-warning/14 px-3 py-1 text-xs font-medium text-warning">
            <Clock className="size-3.5" /> Under review
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            <Field label="Registered business name">
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="As on your CAC certificate" />
            </Field>
            <Field label="CAC / RC number">
              <Input value={rc} onChange={(e) => setRc(e.target.value)} placeholder="e.g. RC 1234567" />
            </Field>
            <Field label="Registered business address">
              <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="The address on your CAC registration" />
            </Field>
            <Field label="Person responsible for this account">
              <Input value={director} onChange={(e) => setDirector(e.target.value)} placeholder="Full name of a director or authorised rep" />
            </Field>
            <Field label="Their Virtual NIN or Share Code" hint="A one-time code from the NIMC app, never an 11-digit NIN. It ties this business to a real person and is deleted after review.">
              <Input
                autoComplete="off"
                value={directorId}
                onChange={(e) => setDirectorId(e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 16).toUpperCase())}
                placeholder="Share Code or 16-character Virtual NIN"
              />
            </Field>
            <label className="flex items-start gap-2 text-xs text-ink-2">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
              <span>The named person agrees UGCOrigin can use this code to confirm they are real and responsible for this business. The code is deleted after review.</span>
            </label>
            {err && <p className="text-sm text-error">{err}</p>}
            <div>
              <Button onClick={submit} loading={pending} disabled={!company.trim() || !rc.trim() || !address.trim() || !director.trim() || !directorId.trim() || !consent}>
                Submit for review
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
