"use client";

import { useEffect } from "react";
import { track } from "./track";

/**
 * Fires one analytics event when it mounts. Drop it into a server-rendered page
 * (a brief/campaign detail, a "welcome" dashboard) to record a ViewContent,
 * CompleteRegistration, etc. without turning the whole page into a client
 * component. Renders nothing. Consent is enforced inside `track`.
 *
 * `once` keys a sessionStorage guard so a one-time event (a signup) is not
 * re-counted if the page re-renders or the visitor refreshes.
 */
export function FireEvent({
  name,
  params,
  once,
}: {
  name: string;
  params?: Record<string, unknown>;
  once?: string;
}) {
  useEffect(() => {
    if (once) {
      try {
        const key = `ugc:evt:${once}`;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
      } catch {
        /* storage blocked → fire anyway */
      }
    }
    track(name, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
