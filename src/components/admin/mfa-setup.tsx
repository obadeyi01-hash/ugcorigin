"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type Mode = "loading" | "enroll" | "verify" | "done";

/**
 * Admin TOTP (authenticator-app) setup + verify. An admin whose session isn't
 * aal2 lands here (see requireSection). Two paths:
 *   • no factor yet  → enroll: show a QR to scan, then verify a 6-digit code.
 *   • factor exists  → verify: just enter a current code to lift the session to aal2.
 * On success the session becomes aal2 and we return to the console.
 */
export function MfaSetup() {
  const router = useRouter();
  const supabase = useRef(createClient()).current;

  const [mode, setMode] = useState<Mode>("loading");
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Decide enroll vs verify on mount: reuse a verified factor if one exists,
  // otherwise clean up any stale unverified factors and enroll a fresh one.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: factors, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;
        if (cancelled) return;

        const verified = factors?.totp ?? [];
        if (verified.length > 0) {
          setFactorId(verified[0].id);
          setMode("verify");
          return;
        }

        // Remove half-finished enrollments so a retry doesn't collide.
        const stale = (factors?.all ?? []).filter((f) => f.status !== "verified");
        for (const f of stale) {
          await supabase.auth.mfa.unenroll({ factorId: f.id }).catch(() => {});
        }

        const { data, error: enrollErr } = await supabase.auth.mfa.enroll({ factorType: "totp" });
        if (enrollErr) throw enrollErr;
        if (cancelled) return;
        setFactorId(data.id);
        setQr(data.totp.qr_code);
        setSecret(data.totp.secret);
        setMode("enroll");
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Couldn't start MFA setup.");
          setMode("enroll");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function verify() {
    if (!factorId) return;
    const token = code.replace(/\s/g, "");
    if (token.length < 6) {
      setErr("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
      if (chErr) throw chErr;
      const { error: vErr } = await supabase.auth.mfa.verify({ factorId, challengeId: ch.id, code: token });
      if (vErr) throw vErr;
      setMode("done");
      // Session is now aal2 — refresh so the server guards let us through.
      router.refresh();
      setTimeout(() => router.push("/admin"), 600);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "That code didn't verify. Try the current one.");
      setBusy(false);
    }
  }

  if (mode === "loading") {
    return <p className="text-sm text-ink-3">Preparing secure setup…</p>;
  }

  if (mode === "done") {
    return (
      <div className="space-y-2">
        <p className="font-medium text-ink">Two-factor is on. ✓</p>
        <p className="text-sm text-ink-3">Taking you to the admin console…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {mode === "enroll" && (
        <div className="space-y-3">
          <p className="text-sm text-ink-2">
            Scan this QR with an authenticator app (Google Authenticator, 1Password, Authy), then enter the 6-digit code it shows.
          </p>
          {qr && (
            <div className="inline-flex rounded-2xl border border-line bg-white p-3">
              {/* Supabase returns the QR as an SVG data URI. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="TOTP QR code" width={180} height={180} />
            </div>
          )}
          {secret && (
            <p className="text-xs text-ink-3">
              Can&apos;t scan? Enter this key manually: <span className="font-mono text-ink-2">{secret}</span>
            </p>
          )}
        </div>
      )}

      {mode === "verify" && (
        <p className="text-sm text-ink-2">
          Enter the current 6-digit code from your authenticator app to continue.
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && verify()}
          className="sm:max-w-40 tracking-[0.3em] text-center"
        />
        <Button loading={busy} onClick={verify}>
          Verify &amp; continue
        </Button>
      </div>

      {err && <p className="text-sm text-error">{err}</p>}
    </div>
  );
}
