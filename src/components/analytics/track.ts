"use client";

/**
 * One call to fan a conversion event out to every analytics provider that is
 * loaded: Meta Pixel (standard or custom), GA4/gtag, and the GTM dataLayer.
 *
 * Consent-first: nothing fires unless the visitor accepted cookies (the same
 * `ugc:consent` key the banner sets), and it never throws into the UI. Set the
 * env IDs (NEXT_PUBLIC_META_PIXEL_ID etc.) and these events start flowing; add
 * a new event anywhere by calling `track("EventName", { ...params })`.
 */

// Meta's standard events. Anything not in here is sent to Meta as a custom
// event (fbq("trackCustom", ...)) so it still lands, just not as a standard one.
const META_STANDARD = new Set([
  "PageView", "ViewContent", "Search", "AddToWishlist", "AddToCart",
  "InitiateCheckout", "AddPaymentInfo", "Purchase", "Lead", "CompleteRegistration",
  "Contact", "Subscribe", "StartTrial", "Schedule", "SubmitApplication",
  "FindLocation", "Donate", "CustomizeProduct",
]);

export function track(name: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem("ugc:consent") !== "accepted") return;
  } catch {
    return; // storage blocked → treat as no consent
  }
  try {
    if (window.fbq) window.fbq(META_STANDARD.has(name) ? "track" : "trackCustom", name, params ?? {});
    if (window.gtag) window.gtag("event", name, params ?? {});
    if (window.dataLayer) window.dataLayer.push({ event: name, ...(params ?? {}) });
  } catch {
    /* analytics must never break a user action */
  }
}
