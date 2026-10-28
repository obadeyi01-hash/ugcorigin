"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Trash2, Video as VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signVideoUpload, saveProfileVideo, deleteProfileVideo } from "@/app/media/actions";
import { validateVideo, LIMITS } from "@/lib/upload-limits";

type Vid = { id: string; url: string; poster_url: string | null };

export function VideoManager({ videos: initial }: { videos: Vid[] }) {
  const router = useRouter();
  const [videos, setVideos] = useState<Vid[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || uploading) return;
    setErr(null);
    const check = await validateVideo(file, "showcase");
    if (!check.ok) return setErr(check.error);

    setUploading(true);
    setProgress(0);
    const sig = await signVideoUpload();
    if (!sig.ok) {
      setUploading(false);
      return setErr(sig.error);
    }

    try {
      const publicId = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`);
        xhr.upload.onprogress = (ev) => ev.lengthComputable && setProgress(Math.round((ev.loaded / ev.total) * 100));
        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              resolve(JSON.parse(xhr.responseText).public_id as string);
            } catch {
              reject(new Error("Upload failed."));
            }
          } else reject(new Error("Upload failed."));
        };
        xhr.onerror = () => reject(new Error("Network error during upload."));
        const fd = new FormData();
        fd.append("file", file);
        fd.append("api_key", sig.apiKey);
        fd.append("timestamp", String(sig.timestamp));
        fd.append("signature", sig.signature);
        fd.append("folder", sig.folder);
        xhr.send(fd);
      });

      const r = await saveProfileVideo(publicId);
      if (r.error) setErr(r.error);
      else router.refresh();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Upload failed.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    const r = await deleteProfileVideo(id);
    setBusyId(null);
    if (r.error) setErr(r.error);
    else setVideos((v) => v.filter((x) => x.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-display font-semibold text-ink">Showcase videos</p>
          <p className="text-xs text-ink-3">Up to 6. {LIMITS.showcase.guide}</p>
        </div>
        <input ref={fileRef} type="file" accept="video/mp4,video/quicktime,video/webm" onChange={onFile} className="hidden" />
        <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading || videos.length >= 6}>
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {uploading ? `Uploading ${progress}%` : "Add video"}
        </Button>
      </div>

      {uploading && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {err && <p className="mt-2 text-xs text-error">{err}</p>}

      {videos.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {videos.map((v) => (
            <div key={v.id} className="group relative overflow-hidden rounded-xl border border-line bg-obsidian">
              <video
                src={v.url}
                poster={v.poster_url ?? undefined}
                controls
                preload="none"
                playsInline
                data-showcase-preview=""
                className="aspect-[9/16] w-full object-cover"
                onPlay={(event) => {
                  const current = event.currentTarget;
                  document.querySelectorAll<HTMLVideoElement>("[data-showcase-preview]").forEach((node) => {
                    if (node !== current) node.pause();
                  });
                }}
              />
              <button
                onClick={() => remove(v.id)}
                disabled={busyId === v.id}
                aria-label="Remove video"
                className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-obsidian/70 text-chalk hover:bg-obsidian"
              >
                {busyId === v.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              </button>
            </div>
          ))}
        </div>
      ) : (
        !uploading && (
          <div className="mt-4 grid place-items-center rounded-xl border border-dashed border-line py-10 text-center">
            <VideoIcon className="size-6 text-ink-3" />
            <p className="mt-2 text-sm text-ink-3">No videos yet. Add a few short clips to show your work.</p>
          </div>
        )
      )}
    </div>
  );
}
