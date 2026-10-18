"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Share2, Copy, Check, Download, X, ImageDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareCard({ url, name, handle }: { url: string; name: string; handle: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  async function nativeShare() {
    try {
      if (navigator.share) await navigator.share({ title: `${name} on UGCOrigin`, url });
      else await copy();
    } catch {}
  }

  function downloadImage() {
    const a = document.createElement("a");
    a.href = `/card/${handle}?download=1`;
    a.download = `${handle}-ugcorigin.png`;
    a.click();
  }

  function saveContact() {
    const vcard = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${name}`,
      `NICKNAME:@${handle}`,
      `URL:${url}`,
      "NOTE:UGCOrigin creator",
      "END:VCARD",
    ].join("\n");
    const blob = new Blob([vcard], { type: "text/vcard" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${handle}.vcf`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        <Share2 className="size-4" /> Share card
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-obsidian/50 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-ink-3 hover:bg-surface-2 hover:text-ink"
            >
              <X className="size-4" />
            </button>

            <h2 className="font-display text-lg font-semibold text-ink">Share {name}</h2>
            <p className="mt-0.5 text-sm text-ink-2">Download the card, scan the code, or copy the link.</p>

            {/* Card image preview (server-rendered, shareable PNG) */}
            <div className="mt-4 overflow-hidden rounded-xl border border-line bg-obsidian">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/card/${handle}`} alt={`${name}'s UGCOrigin card`} width={1200} height={630} className="w-full" />
            </div>
            <Button variant="secondary" className="mt-3 w-full" onClick={downloadImage}>
              <ImageDown className="size-4" /> Download card image
            </Button>

            <div className="mt-4 grid place-items-center rounded-2xl border border-line bg-chalk p-5">
              <QRCodeSVG value={url} size={176} bgColor="transparent" fgColor="#141519" level="M" />
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2">
              <span className="flex-1 truncate text-sm text-ink-2">{url.replace(/^https?:\/\//, "")}</span>
              <button onClick={copy} className="u-press inline-flex items-center gap-1 rounded-lg bg-surface px-2.5 py-1 text-xs font-medium text-ink hover:bg-paper">
                {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button size="sm" onClick={nativeShare}><Share2 className="size-4" /> Share</Button>
              <Button size="sm" variant="secondary" onClick={saveContact}><Download className="size-4" /> Save contact</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
