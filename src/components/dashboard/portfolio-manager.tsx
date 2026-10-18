"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { SocialIcon } from "@/components/ui/social-icons";
import { addPortfolioLinkAction, removePortfolioLinkAction } from "@/app/portfolio/actions";

export type PortfolioLink = { id: string; platform: string; url: string };

export function PortfolioManager({ links }: { links: PortfolioLink[] }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function add() {
    setErr(null);
    start(async () => {
      const res = await addPortfolioLinkAction(url);
      if (res.error) setErr(res.error);
      else { setUrl(""); router.refresh(); }
    });
  }

  return (
    <Card>
      <CardBody>
        <p className="font-semibold text-ink">Featured work</p>
        <p className="mt-0.5 text-sm text-ink-2">Paste links to your X, Instagram, TikTok or YouTube posts, they embed live on your profile.</p>
        <div className="mt-3 flex gap-2">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" onKeyDown={(e) => e.key === "Enter" && add()} />
          <Button onClick={add} loading={pending} disabled={!url.trim()}><Plus className="size-4" /> Add</Button>
        </div>
        {err && <p className="mt-2 text-sm text-error">{err}</p>}

        {links.length > 0 && (
          <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
            {links.map((l) => (
              <li key={l.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-2">
                  <SocialIcon platform={l.platform} className="size-3.5" />
                </span>
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-sm text-ink-2 hover:text-ink">
                  {l.url}
                </a>
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-ink-3 hover:text-ink"><ExternalLink className="size-4" /></a>
                <button
                  onClick={() => start(async () => { await removePortfolioLinkAction(l.id); router.refresh(); })}
                  className="text-ink-3 hover:text-error"
                  aria-label="Remove"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
