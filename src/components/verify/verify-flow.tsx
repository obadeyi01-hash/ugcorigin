"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Check, ShieldCheck, Landmark, UserCheck, FileText, Rocket, Camera, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Bank } from "@/lib/payments/paystack";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import { validateFile } from "@/lib/upload-limits";
import {
  verifyBankAction,
  acceptAgreementsAction,
  startIdentityAction,
  signSelfieUpload,
  submitIdentityAction,
  goLiveAction,
} from "@/app/verify/actions";

type Profile = {
  handle: string;
  completeness: number;
  bank_verified: boolean;
  identity_verified: boolean;
  photo_verified: boolean;
  agreements_accepted_at: string | null;
  verification_status: string;
};

type Identity = {
  status: "pending" | "approved" | "rejected" | null;
  hasSelfie: boolean;
  rejectReason: string | null;
};

const MIN = 80;

export function VerifyFlow({
  profile,
  identity,
  banks,
  kycConfigured,
  paystackConfigured,
  cloudinaryConfigured,
}: {
  profile: Profile;
  identity: Identity;
  banks: Bank[];
  kycConfigured: boolean;
  paystackConfigured: boolean;
  cloudinaryConfigured: boolean;
}) {
  const [bankDone, setBankDone] = useState(profile.bank_verified);
  const [bankName, setBankName] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(!!profile.agreements_accepted_at);
  const identityDone = profile.identity_verified && profile.photo_verified;
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
            <Link href="/settings"><Button size="sm" variant="secondary">Edit profile</Button></Link>
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

        <IdentityStep
          done={identityDone}
          identity={identity}
          kycConfigured={kycConfigured}
          cloudinaryConfigured={cloudinaryConfigured}
        />

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
                  <Link href="/payment-protection-terms" className="text-accent hover:underline">Payment protection terms</Link>.
                </span>
              </label>
            </div>
          )}
        </Step>
      </div>

      {err && <p className="mt-4 text-sm text-error">{err}</p>}

      <div className="mt-6 border-t border-line pt-6">
        <Button onClick={() => {
          setGoErr(null);
          start(async () => {
            const res = await goLiveAction();
            if (res.missing) setGoErr(res.missing);
            else if (res.error) setGoErr([res.error]);
          });
        }} loading={pending} disabled={!allDone} className="w-full sm:w-auto">
          <Rocket className="size-4" /> Go live
        </Button>
        {goErr && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-error">
            {goErr.map((m) => <li key={m}>{m}</li>)}
          </ul>
        )}
        {!allDone && !goErr && (
          profileDone && bankDone && agreed && !identityDone && identity.status === "pending" ? (
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

/* --------------------------- identity verification -------------------------- */

function IdentityStep({
  done,
  identity,
  kycConfigured,
  cloudinaryConfigured,
}: {
  done: boolean;
  identity: Identity;
  kycConfigured: boolean;
  cloudinaryConfigured: boolean;
}) {
  // A pending creator sees a read-only "under review" card they can re-open to
  // edit; an unverified or rejected creator sees the submission form directly.
  const [status, setStatus] = useState<Identity["status"]>(identity.status);
  const [editing, setEditing] = useState(identity.status !== "pending");

  const [selfieRef, setSelfieRef] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [nin, setNin] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const desc = done
    ? "Identity verified."
    : status === "pending"
      ? "Under review. Our team is confirming you're a real person. Usually within 24 hours."
      : status === "rejected"
        ? "Your last submission couldn't be approved. Please resubmit."
        : "Confirm you're a real person with a photo and a one-time NIMC code, never your 11-digit NIN. A human reviews it, usually within 24 hours.";

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr(null);

    const check = validateFile(file, "avatar");
    if (!check.ok) return setErr(check.error);

    // Reject obviously-bad photos where we can: require a reasonable resolution
    // so a blurry/tiny crop doesn't slip through before a human even looks.
    try {
      const dims = await readImageSize(file);
      if (dims.w < 400 || dims.h < 400) {
        return setErr("That photo is too small. Use a clear, well-lit photo at least 400×400.");
      }
    } catch {
      /* can't read dimensions — let the human reviewer judge it */
    }

    setBusy(true);
    const sig = await signSelfieUpload();
    if (sig.error || !sig.upload) {
      setBusy(false);
      return setErr(sig.error ?? "Photo upload isn’t available right now.");
    }
    try {
      const up = await uploadToCloudinary(file, sig.upload);
      setSelfieRef(up.ref);
      setSelfiePreview(URL.createObjectURL(file));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed, try again.");
    }
    setBusy(false);
  }

  function submit() {
    setErr(null);
    if (!selfieRef) return setErr("Please add a clear photo of yourself.");
    if (!consent) return setErr("Confirm you agree to the identity check before submitting.");
    start(async () => {
      const res = await submitIdentityAction({ nin, selfieRef, consent });
      if (res.error) setErr(res.error);
      else {
        setStatus("pending");
        setEditing(false);
        setNin(""); // don't keep the NIN in memory after submitting
      }
    });
  }

  return (
    <Step icon={UserCheck} title="Verify your identity" done={done} desc={desc}>
      {done ? null : kycConfigured ? (
        <StartAutomated />
      ) : status === "pending" && !editing ? (
        <div className="grid gap-2">
          <p className="rounded-lg bg-accent-tint/60 px-3 py-2 text-xs text-ink-2">
            Thanks, you&apos;re in the review queue. We&apos;ll verify you and set you live automatically. We&apos;ll notify you.
          </p>
          <div>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              <Pencil className="size-3.5" /> Edit submission
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {status === "rejected" && identity.rejectReason && (
            <p className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-xs text-error">
              Reviewer note: {identity.rejectReason}
            </p>
          )}

          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Your photo</p>
            <div className="flex items-center gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                {selfiePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selfiePreview} alt="" className="size-full object-cover" />
                ) : identity.hasSelfie ? (
                  <span className="grid size-full place-items-center text-[10px] text-ink-3">On file</span>
                ) : (
                  <span className="grid size-full place-items-center text-ink-3"><Camera className="size-5" /></span>
                )}
                {busy && (
                  <span className="absolute inset-0 grid place-items-center bg-obsidian/40">
                    <Loader2 className="size-5 animate-spin text-chalk" />
                  </span>
                )}
              </div>
              <div>
                <input ref={fileRef} type="file" accept="image/*" capture="user" onChange={onFile} className="hidden" />
                <Button type="button" size="sm" variant="secondary" disabled={busy || !cloudinaryConfigured} onClick={() => fileRef.current?.click()}>
                  <Camera className="size-4" /> {selfieRef || identity.hasSelfie ? "Change photo" : "Add photo"}
                </Button>
                <p className="mt-1 text-xs text-ink-3">A clear, well-lit photo of your face. This is the photo on your public profile. A teammate reviews it until face-match with NIMC is connected.</p>
                {!cloudinaryConfigured && <p className="mt-1 text-xs text-warning">Photo upload activates once media hosting is configured.</p>}
              </div>
            </div>
          </div>

          <Field label="Virtual NIN or Share Code" hint="A one-time code from the official NIMC app, never your 11-digit NIN. We delete it after review.">
            <Input
              autoComplete="off"
              placeholder="Share Code or 16-character Virtual NIN"
              value={nin}
              onChange={(e) => setNin(e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 16).toUpperCase())}
            />
          </Field>
          <IdentityCodeGuide />
          <label className="flex items-start gap-2 text-xs text-ink-2">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
            <span>I agree UGCOrigin can use this Virtual NIN and my photo to confirm I am a real person. The code is deleted after review.</span>
          </label>

          {err && <p className="text-sm text-error">{err}</p>}

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={submit} loading={pending} disabled={busy}>
              Submit for review
            </Button>
            {status === "pending" && (
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            )}
          </div>
        </div>
      )}
    </Step>
  );
}

function IdentityCodeGuide() {
  return (
    <details className="rounded-xl bg-surface-2 px-3 py-2.5 text-xs text-ink-2">
      <summary className="cursor-pointer font-medium text-ink">How to get your code</summary>
      <div className="mt-3 grid gap-3">
        <p>
          You never give us your 11-digit NIN, here or anywhere. You generate a
          short code from NIMC&apos;s own app that proves who you are without exposing
          it, and you can revoke it whenever you like.
        </p>
        <div>
          <p className="font-medium text-ink">Share Code <span className="font-normal text-ink-3">(easiest)</span></p>
          <ol className="mt-1 list-decimal space-y-1 pl-4">
            <li>Install the official NINAuth app from ninauth.nimc.gov.ng. Skip download links sent in chats.</li>
            <li>Sign in with the NIN you already have.</li>
            <li>On the home screen, tap Get a Share Code.</li>
            <li>Paste that code here. It lasts up to 30 days, and you can revoke it in the app.</li>
          </ol>
        </div>
        <div>
          <p className="font-medium text-ink">Virtual NIN</p>
          <ol className="mt-1 list-decimal space-y-1 pl-4">
            <li>Install or update the NIMC MWS Mobile ID app.</li>
            <li>Unlock it with your PIN, then tap GET VIRTUAL NIN.</li>
            <li>Read the privacy notice, tap the + button, and paste the 16-character code here.</li>
          </ol>
        </div>
      </div>
    </details>
  );
}

function StartAutomated() {
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="grid gap-2">
      <Button size="sm" loading={pending} onClick={() => {
        setErr(null);
        start(async () => {
          const res = await startIdentityAction();
          if ("error" in res && res.error) setErr(res.error);
          else if ("configured" in res && res.configured && res.url) window.location.href = res.url;
          else setErr("Identity verification isn't connected yet. Please check back soon.");
        });
      }}>Start verification</Button>
      {err && <p className="text-sm text-error">{err}</p>}
    </div>
  );
}

/** Read an image file's intrinsic dimensions in the browser (no upload). */
function readImageSize(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode"));
    };
    img.src = url;
  });
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
