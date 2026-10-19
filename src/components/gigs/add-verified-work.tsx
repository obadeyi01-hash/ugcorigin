"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, UploadCloud, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { signVideoUpload, saveVerifiedWork } from "@/app/media/actions";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import { validateVideo, LIMITS } from "@/lib/upload-limits";

// Shown to the creator on a completed gig: upload the public cut of the work to
// feature it on their profile as a VERIFIED piece (tied to this real gig).
export function AddVerifiedWork({ gigId, alreadyFeatured }: { gigId: string; alreadyFeatured: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(alreadyFeatured);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr(null);
    const check = await validateVideo(file, "showcase");
    if (!check.ok) return setErr(check.error);

    setUploading(true);
    setProgress(0);
    try {
      const sig = await signVideoUpload();
      if (!sig.ok) throw new Error(sig.error);
      const up = await uploadToCloudinary(file, { cloudName: sig.cloudName, apiKey: sig.apiKey, timestamp: sig.timestamp, signature: sig.signature, folder: sig.folder }, setProgress);
      const r = await saveVerifiedWork(gigId, up.publicId, caption);
      if (r.error) throw new Error(r.error);
      setDone(true);
      router.refresh();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Upload failed.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  if (done) {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardBody>
          <p className="flex items-center gap-2 font-semibold text-ink">
            <Check className="size-4 text-success" /> Featured on your profile
          </p>
          <p className="mt-0.5 text-sm text-ink-2">This verified clip now shows on your public profile with a Verified badge.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="border-accent/30">
      <CardBody>
        <p className="flex items-center gap-2 font-semibold text-ink">
          <ShieldCheck className="size-4 text-success" /> Feature this work on your profile
        </p>
        <p className="mt-0.5 text-sm text-ink-2">
          Upload the public cut to showcase it as verified, real work delivered on UGCOrigin. Verified clips are uncapped and rank higher.
        </p>
        {!open ? (
          <Button variant="secondary" className="mt-3" onClick={() => setOpen(true)}>Add to my showcase</Button>
        ) : (
          <div className="mt-3">
            <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Optional caption, e.g. 'Skincare unboxing for Glow Co.'" className="min-h-16" />
            <p className="mt-1 text-xs text-ink-3">{LIMITS.showcase.guide}</p>
            <input ref={fileRef} type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={onFile} disabled={uploading} />
            <Button className="mt-3" onClick={() => fileRef.current?.click()} loading={uploading} disabled={uploading}>
              {uploading ? <>Uploading {progress}%</> : <><UploadCloud className="size-4" /> Choose video</>}
            </Button>
            {uploading && (
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
            {err && <p className="mt-2 text-sm text-error">{err}</p>}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
