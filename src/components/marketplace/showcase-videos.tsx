"use client";

import { useEffect, useRef, useState } from "react";
import { Play, X } from "lucide-react";
import { claimMedia, releaseMedia } from "@/lib/media/exclusive";

const OWNER = "showcase";

export type ShowcaseVideo = {
  id: string;
  url: string;
  poster: string | null;
  verified?: boolean;
  caption?: string | null;
};

function clipLabel(video: ShowcaseVideo, index: number) {
  const caption = video.caption?.trim();
  return caption || `showcase video ${index + 1}`;
}

export function ShowcaseVideos({ videos }: { videos: ShowcaseVideo[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const playerRef = useRef<HTMLVideoElement>(null);
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<() => void>(() => {});
  const open = videos.find((video) => video.id === openId) ?? null;

  function close() {
    playerRef.current?.pause();
    setOpenId(null);
    setFailed(false);
    const back = returnFocus.current;
    returnFocus.current = null;
    requestAnimationFrame(() => back?.focus());
  }
  closeRef.current = close;

  useEffect(() => {
    if (!openId) return;
    claimMedia(OWNER);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      playerRef.current?.pause();
      releaseMedia(OWNER);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [openId]);

  function openClip(id: string, button: HTMLButtonElement) {
    playerRef.current?.pause();
    returnFocus.current = button;
    setFailed(false);
    setAutoPlay(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setOpenId(id);
  }

  return (
    <>
      <div className="mt-3 grid w-full grid-cols-[repeat(auto-fill,minmax(4.25rem,4.75rem))] justify-start gap-2 sm:grid-cols-[repeat(auto-fill,minmax(4.75rem,5.5rem))] sm:gap-2.5">
        {videos.map((video, index) => (
          <figure key={video.id} className="min-w-0">
            <button
              type="button"
              aria-label={`Play ${clipLabel(video, index)}`}
              onClick={(event) => openClip(video.id, event.currentTarget)}
              className="group relative block w-full overflow-hidden rounded-lg border border-line bg-obsidian"
            >
              {video.poster ? (
                // Poster stills cannot play, so a tap only opens the large player.
                <img src={video.poster} alt="" className="aspect-[9/16] w-full object-cover" />
              ) : (
                <video
                  src={video.url}
                  muted
                  playsInline
                  preload="metadata"
                  tabIndex={-1}
                  aria-hidden="true"
                  className="pointer-events-none aspect-[9/16] w-full object-cover"
                  onPlay={(event) => event.currentTarget.pause()}
                />
              )}
              <span className="absolute inset-0 grid place-items-center bg-obsidian/20 transition-colors group-hover:bg-obsidian/40">
                <span className="grid size-7 place-items-center rounded-full bg-white/90 text-ink sm:size-8">
                  <Play className="size-3.5 translate-x-px sm:size-4" />
                </span>
              </span>
              {video.verified && (
                <span className="absolute left-1 top-1 rounded-full bg-success/90 px-1.5 py-px text-[10px] font-semibold leading-4 text-white">
                  Verified
                </span>
              )}
            </button>
            {video.caption && (
              <figcaption className="mt-1 line-clamp-2 text-[11px] leading-4 text-ink-2">{video.caption}</figcaption>
            )}
          </figure>
        ))}
      </div>
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-obsidian/80 p-4"
          onClick={close}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={open.caption || "Showcase video"}
            className="relative w-full max-w-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              className="absolute -top-10 right-0 grid size-8 place-items-center rounded-full text-white hover:bg-white/10"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
            {failed ? (
              <p className="grid min-h-64 place-items-center rounded-2xl bg-black px-6 text-center text-sm text-white">
                This clip couldn&apos;t be played.
              </p>
            ) : (
              <video
                key={open.id}
                ref={playerRef}
                src={open.url}
                poster={open.poster ?? undefined}
                controls
                autoPlay={autoPlay}
                playsInline
                data-media-owner={OWNER}
                className="max-h-[85vh] w-full rounded-2xl bg-black"
                onPlay={() => claimMedia(OWNER)}
                onError={() => setFailed(true)}
              />
            )}
            {open.caption && <p className="mt-2 text-sm text-white">{open.caption}</p>}
          </div>
        </div>
      )}
    </>
  );
}
