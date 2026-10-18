"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cookie } from "lucide-react";

/**
 * Privacy-first analytics. NOTHING loads until the visitor explicitly accepts,
 * and each provider only loads if its env ID is set, so with no keys and/or no
 * consent, zero third-party scripts run. GA4 + Microsoft Clarity + Meta Pixel.
 * The footer's "Cookie preferences" link reopens the banner via a custom event.
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const HAS_ANY = !!(GA_ID || CLARITY_ID || META_PIXEL_ID);

const KEY = "ugc:consent"; // "accepted" | "declined"
type Consent = "accepted" | "declined" | null;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export function Analytics() {
  const [consent, setConsent] = useState<Consent>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const firstPath = useRef(true);

  useEffect(() => {
    setMounted(true);
    try {
      const v = localStorage.getItem(KEY);
      if (v === "accepted" || v === "declined") setConsent(v);
    } catch {
      /* private mode / blocked storage */
    }
    function reopen() {
      setConsent(null);
    }
    window.addEventListener("open-cookie-preferences", reopen);
    return () => window.removeEventListener("open-cookie-preferences", reopen);
  }, []);

  // SPA page views on route change (after the scripts' own initial page view).
  useEffect(() => {
    if (consent !== "accepted") return;
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    if (GA_ID && window.gtag) window.gtag("event", "page_view", { page_path: pathname });
    if (META_PIXEL_ID && window.fbq) window.fbq("track", "PageView");
  }, [pathname, consent]);

  function choose(v: Exclude<Consent, null>) {
    try {
      localStorage.setItem(KEY, v);
    } catch {
      /* ignore */
    }
    setConsent(v);
  }

  const loadScripts = mounted && consent === "accepted" && HAS_ANY;
  const showBanner = mounted && consent === null && HAS_ANY;

  return (
    <>
      {loadScripts && GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}

      {loadScripts && CLARITY_ID && (
        <Script id="clarity-init" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
        </Script>
      )}

      {loadScripts && META_PIXEL_ID && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
        </Script>
      )}

      {showBanner && (
        <div className="fixed inset-x-0 bottom-0 z-[90] p-4">
          <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-line bg-surface/95 p-4 shadow-xl backdrop-blur-xl sm:flex-row sm:items-center sm:gap-4 sm:p-5">
            <Cookie className="hidden size-6 shrink-0 text-accent sm:block" />
            <p className="flex-1 text-sm text-ink-2">
              We use cookies to understand how UGCOrigin is used and improve it. Nothing loads until you choose.{" "}
              <Link href="/privacy" className="font-medium text-accent hover:underline">Privacy Policy</Link>.
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => choose("declined")}
                className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink-2 hover:text-ink"
              >
                Decline
              </button>
              <button
                onClick={() => choose("accepted")}
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:bg-accent-bright"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Footer link to reopen the cookie banner. */
export function CookiePreferences() {
  if (!HAS_ANY) return null;
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("open-cookie-preferences"))}
      className="text-sm text-ink-2 transition-colors hover:text-ink"
    >
      Cookie preferences
    </button>
  );
}
