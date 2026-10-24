import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, BadgeCheck, Banknote } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { SAMPLE_CREATORS } from "@/lib/sample-data";

// A real Nigerian creator photo (Pexels, free for commercial use) as the
// backdrop, with a dark overlay for legibility.
const HERO = SAMPLE_CREATORS[2];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Form side */}
      <div className="flex flex-col px-6 py-8 sm:px-10">
        <Link href="/" aria-label="UGCOrigin home">
          <Logo variant="combined" size={30} />
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <Suspense fallback={null}>{children}</Suspense>
        </div>
        {/* Mobile-only trust strip — the brand panel carries this on lg+ */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-ink-3 lg:hidden">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-accent" /> Escrow-protected</span>
          <span className="inline-flex items-center gap-1.5"><BadgeCheck className="size-3.5 text-accent" /> Verified humans</span>
          <span className="inline-flex items-center gap-1.5"><Banknote className="size-3.5 text-accent" /> Next-day payouts</span>
        </div>
      </div>

      {/* Brand side, real creator photo backdrop + dark overlay */}
      <div className="relative hidden overflow-hidden bg-obsidian p-12 text-chalk lg:flex lg:flex-col lg:justify-between">
        <Image src={HERO.image!} alt="" fill sizes="50vw" priority className="object-cover" />
        <div className="absolute inset-0 bg-obsidian/72" />
        <div className="u-grain pointer-events-none absolute inset-0 opacity-20" />

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-bright">UGCOrigin</p>
          <h2 className="mt-4 max-w-sm font-display text-3xl font-bold leading-tight text-chalk">
            Original content from <span className="text-accent-bright">real humans</span>.
          </h2>
          <p className="mt-3 max-w-sm text-chalk/80">
            Hire verified creators, run escrow-protected campaigns, and get UGC that converts, all in one place.
          </p>
        </div>

        <ul className="relative space-y-3 text-sm text-chalk/85">
          <li className="flex items-center gap-2.5"><ShieldCheck className="size-4 text-accent-bright" /> Escrow-protected payments</li>
          <li className="flex items-center gap-2.5"><BadgeCheck className="size-4 text-accent-bright" /> Identity-verified creators</li>
          <li className="flex items-center gap-2.5"><Banknote className="size-4 text-accent-bright" /> Next-day payouts via Paystack</li>
        </ul>
      </div>
    </div>
  );
}
