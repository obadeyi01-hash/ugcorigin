import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Card, CardBody } from "@/components/ui/card";
import { MfaSetup } from "@/components/admin/mfa-setup";
import { getAdminContext, adminMfaStatus } from "@/lib/admin/rbac";

export const metadata: Metadata = { title: "Admin · Two-factor" };

async function MfaInner() {
  // Admin identity only — do NOT use requireSection here (it redirects non-aal2
  // admins back to this page, which would loop).
  const ctx = await getAdminContext();
  if (!ctx) redirect("/dashboard");

  const mfa = await adminMfaStatus();
  const alreadySecure = !mfa.required || mfa.satisfied;

  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-line bg-paper/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-2xl items-center gap-3 px-6">
          <Link href="/"><Logo variant="combined" size={30} /></Link>
          <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-paper">Admin</span>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-6 py-12">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-accent-tint text-accent">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Two-factor authentication</h1>
            <p className="text-sm text-ink-3">Required to manage money, users and the rest of the console.</p>
          </div>
        </div>

        <Card>
          <CardBody className="space-y-5">
            {alreadySecure ? (
              <div className="space-y-4">
                <p className="text-sm text-ink-2">
                  Your admin session is protected with two-factor authentication. You&apos;re all set.
                </p>
                <Link
                  href="/admin"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-accent-ink shadow-sm transition-colors hover:bg-accent-hover"
                >
                  Back to the console
                </Link>
              </div>
            ) : (
              <MfaSetup />
            )}
          </CardBody>
        </Card>

        <p className="mt-4 text-center text-xs text-ink-3">
          This protects brand and creator funds. Keep your authenticator app safe.
        </p>
      </main>
    </div>
  );
}

export default function AdminMfaPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <MfaInner />
    </Suspense>
  );
}
