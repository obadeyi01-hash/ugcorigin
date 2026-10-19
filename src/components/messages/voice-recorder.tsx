"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// "Voicebites" — short in-chat voice notes. Hard-capped so they stay snappy and
// cheap to store/stream. Records in the browser (MediaRecorder), shows a live
// timer, auto-stops at the limit, then hands a File up to the chat to upload.

export const VOICEBITE_MAX_SECONDS = 60;

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function pickMime(): { mime: string; ext: string } {
  const prefs: { mime: string; ext: string }[] = [
    { mime: "audio/webm;codecs=opus", ext: "webm" },
    { mime: "audio/webm", ext: "webm" },
    { mime: "audio/mp4", ext: "m4a" },
    { mime: "audio/ogg;codecs=opus", ext: "ogg" },
  ];
  for (const p of prefs) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(p.mime)) return p;
  }
  return { mime: "", ext: "webm" };
}

export function VoiceRecorder({
  onSend,
  disabled,
}: {
  onSend: (file: File, seconds: number) => Promise<void> | void;
  disabled?: boolean;
}) {
  const [state, setState] = useState<"idle" | "recording" | "preview" | "sending">("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<File | null>(null);
  const extRef = useRef<string>("webm");

  useEffect(() => {
    return () => {
      stopTimer();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  async function start() {
    setError(null);
    if (typeof MediaRecorder === "undefined") return setError("Voicebites aren’t supported on this browser.");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return setError("We couldn’t access your mic. Check the browser permission and try again.");
    }
    streamRef.current = stream;
    const { mime, ext } = pickMime();
    extRef.current = ext;
    const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    recorderRef.current = rec;
    chunksRef.current = [];

    rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
    rec.onstop = () => {
      stopTimer();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const type = rec.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type });
      fileRef.current = new File([blob], `voicebite.${extRef.current}`, { type });
      setPreviewUrl(URL.createObjectURL(blob));
      setState("preview");
    };

    rec.start();
    setSeconds(0);
    setState("recording");
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        const next = s + 1;
        if (next >= VOICEBITE_MAX_SECONDS) stop();
        return next;
      });
    }, 1000);
  }

  function stop() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    stopTimer();
  }

  function discard() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    fileRef.current = null;
    setSeconds(0);
    setState("idle");
  }

  async function send() {
    if (!fileRef.current) return;
    setState("sending");
    try {
      await onSend(fileRef.current, seconds);
      discard();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t send that Voicebite.");
      setState("preview");
    }
  }

  if (state === "idle") {
    return (
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={start}
          disabled={disabled}
          aria-label="Record a Voicebite"
          title="Record a Voicebite (voice note)"
          className="grid size-9 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-surface-2 hover:text-ink disabled:opacity-50"
        >
          <Mic className="size-4" />
        </button>
        {error && <span className="sr-only">{error}</span>}
      </div>
    );
  }

  if (state === "recording") {
    return (
      <div className="flex items-center gap-2 rounded-full bg-error/10 px-3 py-1.5">
        <span className="size-2.5 animate-pulse rounded-full bg-error" />
        <span className="font-mono text-sm tabular-nums text-ink">{fmt(seconds)}</span>
        <span className="text-xs text-ink-3">/ {fmt(VOICEBITE_MAX_SECONDS)}</span>
        <button
          type="button"
          onClick={stop}
          aria-label="Stop recording"
          className="grid size-7 place-items-center rounded-full bg-error text-chalk"
        >
          <Square className="size-3.5" />
        </button>
      </div>
    );
  }

  // preview / sending
  return (
    <div className="flex items-center gap-2 rounded-full bg-surface-2 px-2 py-1">
      <span className="px-1 font-mono text-xs tabular-nums text-ink-2">Voicebite · {fmt(seconds)}</span>
      {previewUrl && <audio src={previewUrl} controls className="h-8 max-w-[160px]" />}
      <button
        type="button"
        onClick={discard}
        disabled={state === "sending"}
        aria-label="Discard"
        className="grid size-7 place-items-center rounded-full text-ink-3 hover:text-ink"
      >
        <Trash2 className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={send}
        disabled={state === "sending"}
        aria-label="Send Voicebite"
        className={cn("grid size-8 place-items-center rounded-full bg-accent text-accent-ink", state === "sending" && "opacity-60")}
      >
        {state === "sending" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
      </button>
    </div>
  );
}
