"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Share control for a brief/campaign. Uses the native Web Share sheet on mobile
 * (where most creators are), with a copy-link fallback on desktop, plus a direct
 * WhatsApp link since that's how briefs actually get passed around in Nigeria.
 * `url` is the full absolute URL, built server-side from SITE_URL.
 */
export function ShareButton({ url, title, label = "Share" }: { url: string; title: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user dismissed the sheet, or share failed — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  }

  const waHref = `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" size="sm" onClick={share}>
        {copied ? <Check className="size-4" /> : <Share2 className="size-4" />} {copied ? "Link copied" : label}
      </Button>
      <a href={waHref} target="_blank" rel="noopener noreferrer">
        <Button type="button" variant="ghost" size="sm">WhatsApp</Button>
      </a>
    </div>
  );
}
