"use client";

import { useEffect } from "react";
import { youtubeId, tiktokId } from "@/lib/social/detect";

export type EmbedLink = { id: string; platform: string; url: string };

function loadScript(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => resolve();
    document.body.appendChild(s);
  });
}

// Minimal typings for the embed globals.
type Twttr = { widgets?: { load?: () => void } };
type Instgrm = { Embeds?: { process?: () => void } };

export function SocialEmbeds({ links }: { links: EmbedLink[] }) {
  useEffect(() => {
    const platforms = new Set(links.map((l) => l.platform));
    (async () => {
      if (platforms.has("x")) {
        await loadScript("https://platform.twitter.com/widgets.js");
        (window as unknown as { twttr?: Twttr }).twttr?.widgets?.load?.();
      }
      if (platforms.has("instagram")) {
        await loadScript("https://www.instagram.com/embed.js");
        (window as unknown as { instgrm?: Instgrm }).instgrm?.Embeds?.process?.();
      }
      if (platforms.has("tiktok")) {
        document.querySelector('script[src="https://www.tiktok.com/embed.js"]')?.remove();
        await loadScript("https://www.tiktok.com/embed.js");
      }
    })();
  }, [links]);

  if (links.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="font-display text-lg font-semibold text-ink">Recent work</h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        {links.map((l) => (
          <div key={l.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
            <Embed platform={l.platform} url={l.url} />
          </div>
        ))}
      </div>
    </section>
  );
}

function Embed({ platform, url }: { platform: string; url: string }) {
  if (platform === "youtube") {
    const id = youtubeId(url);
    if (!id) return <Fallback url={url} />;
    return (
      <iframe
        className="aspect-video w-full"
        src={`https://www.youtube.com/embed/${id}`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (platform === "x") {
    return (
      <div className="p-2">
        <blockquote className="twitter-tweet" data-dnt="true">
          <a href={url}>{url}</a>
        </blockquote>
      </div>
    );
  }

  if (platform === "instagram") {
    return (
      <div className="p-2">
        <blockquote
          className="instagram-media"
          data-instgrm-permalink={url}
          data-instgrm-version="14"
          style={{ margin: 0, width: "100%" }}
        />
      </div>
    );
  }

  if (platform === "tiktok") {
    const id = tiktokId(url);
    return (
      <div className="p-2">
        <blockquote className="tiktok-embed" cite={url} data-video-id={id ?? undefined} style={{ margin: 0 }}>
          <section />
        </blockquote>
      </div>
    );
  }

  return <Fallback url={url} />;
}

function Fallback({ url }: { url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block p-4 text-sm text-accent hover:underline">
      View post →
    </a>
  );
}
