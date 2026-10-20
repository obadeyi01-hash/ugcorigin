"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { submitBrandVerification } from "@/app/brand-verify/actions";

export function BrandVerifyCard({ status, companyName, rcNumber }: { status: string; companyName: string; rcNumber: string }) {
  const router = useRouter();
  const [company, setCompany] = useState(companyName);
  const [rc, setRc] = useState(rcNumber);
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
      const r = await submitBrandVerification({ companyName: company, rcNumber: rc });
      if (r.error) setErr(r.error);
      else router.refresh();
    });
  }

  return (
    <Card>
      <CardBody>
        <p className="font-semibold text-ink">Business verification</p>
        <p className="mt-0.5 text-sm text-ink-2">
          Verify your business so creators trust you. We check your CAC/RC number against your company name.
        </p>
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
            {err && <p className="text-sm text-error">{err}</p>}
            <div><Button onClick={submit} loading={pending} disabled={!company.trim() || !rc.trim()}>Submit for review</Button></div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
