"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, ShieldCheck, Landmark, UserCheck, FileText, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Bank } from "@/lib/payments/paystack";
import {
  verifyBankAction,
  acceptAgreementsAction,
  startIdentityAction,
  requestManualVerificationAction,
  goLiveAction,
} from "@/app/verify/actions";

type Profile = {
  handle: string;
  completeness: number;
  bank_verified: boolean;
  identity_verified: boolean;
  agreements_accepted_at: string | null;
  verification_status: string;
};

const MIN = 80;

export function VerifyFlow({
  profile,
  banks,
  kycConfigured,
  paystackConfigured,
}: {
  profile: Profile;
  banks: Bank[];
  kycConfigured: boolean;
  paystackConfigured: boolean;
}) {
  const [bankDone, setBankDone] = useState(profile.bank_verified);
  const [bankName, setBankName] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(!!profile.agreements_accepted_at);
  const identityDone = profile.identity_verified;
  const [reviewPending, setReviewPending] = useState(
    !profile.identity_verified && profile.verification_status === "pending",
  );
  const profileDone = (profile.completeness ?? 0) >= MIN;

  const [bankCode, setBankCode] = useState("");
  const [acct, setAcct] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [goErr, setGoErr] = useState<string[] | null>(null);
  const [pending, start] = useTransition();

  const allDone = profileDone && bankDone && identityDone && agreed;

  function doVerifyBank() {
    setErr(null);
    start(async () => {
      const res = await verifyBankAction(acct.trim(), bankCode);
      if (res.error) setErr(res.error);
      else {
        setBankName(res.accountName ?? null);
        setBankDone(true);
      }
    });
  }
  function doAgree() {
    start(async () => {
      const res = await acceptAgreementsAction();
      if (!res.error) setAgreed(true);
    });
  }
  function doIdentity() {
    setErr(null);
    start(async () => {
      const res = await startIdentityAction();
      if ("error" in res && res.error) setErr(res.error);
      else if ("configured" in res && res.configured && res.url) window.location.href = res.url;
      else setErr("Identity verification isn't connected yet. Please check back soon.");
    });
  }
  function doRequestReview() {
    setErr(null);
    start(async () => {
      const res = await requestManualVerificationAction();
      if (res.error) setErr(res.error);
      else setReviewPending(true);
    });
  }
  function doGoLive() {
    setGoErr(null);
    start(async () => {
      const res = await goLiveAction();
      if (res.missing) setGoErr(res.missing);
      else if (res.error) setGoErr([res.error]);
      // success redirects server-side
    });
  }

  return (
    <div className="w-full max-w-lg">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Go live</h1>
      <p className="mt-1.5 text-sm text-ink-2">
        Finish these to become discoverable and start getting hired. We keep the bar high so brands trust every creator here.
      </p>

      <div className="mt-7 grid gap-3">
        <Step icon={FileText} title="Complete your profile" done={profileDone}
          desc={profileDone ? "Looks good." : `Your profile is ${profile.completeness ?? 0}% complete, add a bit more detail.`}>
          {!profileDone && (
            <Link href="/dashboard"><Button size="sm" variant="secondary">Edit profile</Button></Link>
          )}
        </Step>

        <Step icon={Landmark} title="Verify your bank account" done={bankDone}
          desc={bankDone ? (bankName ? `Verified, ${bankName}` : "Your bank account is verified.") : "We confirm your account name to pay you safely."}>
          {!bankDone && (
            <div className="grid gap-2">
              {!paystackConfigured && (
                <p className="text-xs text-warning">Bank verification activates once the Paystack key is added.</p>
              )}
              <Select value={bankCode} onChange={(e) => setBankCode(e.target.value)} disabled={!paystackConfigured}>
                <option value="">Select your bank</option>
                {banks.map((b) => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </Select>
              <Input
                inputMode="numeric"
                placeholder="10-digit account number"
                value={acct}
                onChange={(e) => setAcct(e.target.value.replace(/\D/g, "").slice(0, 10))}
                disabled={!paystackConfigured}
              />
              <Button size="sm" onClick={doVerifyBank} loading={pending} disabled={!paystackConfigured || !bankCode || acct.length !== 10}>
                Verify account
              </Button>
            </div>
          )}
        </Step>

        <Step icon={UserCheck} title="Verify your identity" done={identityDone}
          desc={identityDone
            ? "Identity verified."
            : reviewPending
              ? "Under review, our team is confirming you're a real human."
              : "A quick check confirms you're a real human."}>
          {!identityDone && (
            kycConfigured ? (
              <Button size="sm" onClick={doIdentity} loading={pending}>Start verification</Button>
            ) : reviewPending ? (
              <p className="rounded-lg bg-accent-tint/60 px-3 py-2 text-xs text-ink-2">
                Thanks, you&apos;re in the review queue. We usually verify within 24 hours and set you live automatically. We&apos;ll notify you.
              </p>
            ) : (
              <div className="grid gap-2">
                <p className="text-xs text-ink-3">Instant ID checks are coming soon. For now, our team verifies you by hand so you&apos;re not held up.</p>
                <Button size="sm" variant="secondary" onClick={doRequestReview} loading={pending}>Submit for review</Button>
              </div>
            )
          )}
        </Step>

        <Step icon={ShieldCheck} title="Accept the agreements" done={agreed}
          desc={agreed ? "Accepted." : undefined}>
          {!agreed && (
            <div className="grid gap-2">
              <label className="flex items-start gap-2 text-sm text-ink-2">
                <input type="checkbox" className="mt-1 accent-[var(--accent)]" onChange={(e) => e.target.checked ? doAgree() : undefined} />
                <span>
                  I agree to the{" "}
                  <Link href="/terms" className="text-accent hover:underline">Terms</Link>,{" "}
                  <Link href="/creator-agreement" className="text-accent hover:underline">Creator Agreement</Link>,{" "}
                  <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>, and{" "}
                  <Link href="/escrow-terms" className="text-accent hover:underline">Escrow Terms</Link>.
                </span>
              </label>
            </div>
          )}
        </Step>
      </div>

      {err && <p className="mt-4 text-sm text-error">{err}</p>}

      <div className="mt-6 border-t border-line pt-6">
        <Button onClick={doGoLive} loading={pending} disabled={!allDone} className="w-full sm:w-auto">
          <Rocket className="size-4" /> Go live
        </Button>
        {goErr && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-error">
            {goErr.map((m) => <li key={m}>{m}</li>)}
          </ul>
        )}
        {!allDone && !goErr && (
          profileDone && bankDone && agreed && !identityDone && reviewPending ? (
            <p className="mt-2 text-xs text-ink-2">
              You&apos;re all set, we&apos;ll set you live automatically once your identity review is done (usually within 24h).
            </p>
          ) : (
            <p className="mt-2 text-xs text-ink-3">Finish all steps above to go live.</p>
          )
        )}
      </div>
    </div>
  );
}

function Step({
  icon: Icon,
  title,
  desc,
  done,
  children,
}: {
  icon: React.ElementType;
  title: string;
  desc?: string;
  done: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border p-5", done ? "border-success/30 bg-success/5" : "border-line bg-surface")}>
      <div className="flex items-start gap-3">
        <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl", done ? "bg-success/15 text-success" : "bg-accent-tint text-accent")}>
          {done ? <Check className="size-5" /> : <Icon className="size-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-ink">{title}</h3>
            {done && <span className="text-xs font-medium text-success">Done</span>}
          </div>
          {desc && <p className="mt-0.5 text-sm text-ink-2">{desc}</p>}
          {children && <div className="mt-3">{children}</div>}
        </div>
      </div>
    </div>
  );
}
