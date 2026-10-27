"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, MessageSquarePlus, Check, RotateCcw, ShieldCheck, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { ReportButton } from "@/components/moderation/report-button";
import { cn, formatNaira } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import { validateVideo, LIMITS } from "@/lib/upload-limits";
import {
  signDeliverableUpload,
  recordDeliverableAction,
  addCommentAction,
  requestRevisionAction,
  approveReleaseAction,
} from "@/app/gigs/actions";

export type Comment = { id: string; timecode_secs: number | null; body: string; author: string };
export type GigData = {
  id: string;
  title: string;
  status: string;
  price_naira: number;
  fee_naira: number;
  tax_naira?: number;
};
export type Deliverable = {
  id: string;
  status: string;
  note: string | null;
  videoUrl: string | null;
} | null;

function fmt(s: number | null) {
  if (s == null) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const STATUS: Record<string, string> = {
  funded: "bg-info/12 text-info",
  in_review: "bg-warning/14 text-warning",
  revision: "bg-warning/14 text-warning",
  completed: "bg-success/12 text-success",
};

export function GigWorkspace({
  gig,
  role,
  deliverable,
  comments,
}: {
  gig: GigData;
  role: "brand" | "creator";
  deliverable: Deliverable;
  comments: Comment[];
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);

  const completed = gig.status === "completed";
  const canUpload = role === "creator" && (!deliverable || deliverable.status === "revision_requested") && !completed;
  const canReview = role === "brand" && deliverable && deliverable.status === "submitted" && !completed;

  function seek(t: number | null) {
    if (videoRef.current && t != null) {
      videoRef.current.currentTime = t;
      videoRef.current.play().catch(() => {});
    }
  }

  function addComment() {
    if (!deliverable || !comment.trim()) return;
    const t = videoRef.current?.currentTime ?? 0;
    start(async () => {
      const res = await addCommentAction(deliverable.id, t, comment);
      if (res.error) setErr(res.error);
      else { setComment(""); router.refresh(); }
    });
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    const check = await validateVideo(file, "deliverable");
    if (!check.ok) {
      setErr(check.error);
      return;
    }
    setUploading(true);
    try {
      const sig = await signDeliverableUpload(gig.id);
      if (sig.error || !sig.upload) throw new Error(sig.error || "Could not start upload.");
      const up = await uploadToCloudinary(file, sig.upload);
      const res = await recordDeliverableAction(gig.id, up.ref, note);
      if (res.error) throw new Error(res.error);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function approve() {
    if (!deliverable) return;
    start(async () => {
      const res = await approveReleaseAction(gig.id, deliverable.id);
      if (res.error) setErr(res.error);
      else router.refresh();
    });
  }
  function revise() {
    if (!deliverable) return;
    start(async () => {
      const res = await requestRevisionAction(gig.id, deliverable.id);
      if (res.error) setErr(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="grid gap-6 py-8 lg:grid-cols-[1fr_340px]">
      {/* Left: deliverable + comments */}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{gig.title}</h1>
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", STATUS[gig.status] ?? "bg-surface-2 text-ink-3")}>
            {gig.status.replace("_", " ")}
          </span>
        </div>

        {/* Video / upload */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-obsidian">
          {deliverable?.videoUrl ? (
            <video ref={videoRef} src={deliverable.videoUrl} controls className="aspect-video w-full bg-black" />
          ) : (
            <div className="grid aspect-video w-full place-items-center text-chalk/50">
              <div className="text-center">
                <Play className="mx-auto size-8" />
                <p className="mt-2 text-sm">{role === "creator" ? "Upload your draft below" : "No draft submitted yet"}</p>
              </div>
            </div>
          )}
        </div>

        {/* Report a submitted delivery (AI/fake, infringing, abusive, off-brief). */}
        {deliverable && role === "brand" && (
          <div className="mt-2 flex justify-end">
            <ReportButton targetType="deliverable" targetId={deliverable.id} label="Report this delivery" />
          </div>
        )}

        {canUpload && (
          <Card className="mt-4">
            <CardBody>
              <p className="font-semibold text-ink">{deliverable?.status === "revision_requested" ? "Upload a revised draft" : "Submit your draft"}</p>
              <p className="mt-0.5 text-sm text-ink-2">Watermarked draft for review. Final files unlock when the brand approves.</p>
              <p className="mt-0.5 text-xs text-ink-3">{LIMITS.deliverable.guide}</p>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note for the brand…" className="mt-3 min-h-16" />
              <label className={cn("mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong bg-surface-2 py-6 text-sm font-medium text-ink-2 hover:border-accent hover:text-accent", uploading && "pointer-events-none opacity-60")}>
                <UploadCloud className="size-5" />
                {uploading ? "Uploading…" : "Choose a video to upload"}
                <input type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={onFile} disabled={uploading} />
              </label>
            </CardBody>
          </Card>
        )}

        {/* Comments / feedback */}
        {deliverable && (
          <div className="mt-6">
            <h2 className="font-display text-lg font-semibold text-ink">Feedback</h2>
            <div className="mt-3 flex gap-2">
              <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a note at the current timestamp…" onKeyDown={(e) => e.key === "Enter" && addComment()} />
              <Button onClick={addComment} loading={pending} disabled={!comment.trim()}>
                <MessageSquarePlus className="size-4" /> At {fmt(videoRef.current?.currentTime ?? 0)}
              </Button>
            </div>
            <ul className="mt-4 space-y-2">
              {comments.length === 0 && <li className="text-sm text-ink-3">No feedback yet. Play the video and leave time-stamped notes.</li>}
              {comments.map((c) => (
                <li key={c.id} className="flex gap-3 rounded-xl border border-line bg-surface p-3">
                  <button onClick={() => seek(c.timecode_secs)} className="u-press h-fit shrink-0 rounded-md bg-accent-tint px-2 py-0.5 text-xs font-semibold text-accent-hover">
                    {fmt(c.timecode_secs)}
                  </button>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-ink-3">{c.author}</p>
                    <p className="text-sm text-ink">{c.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Right: escrow + actions */}
      <aside>
        <Card className="lg:sticky lg:top-20">
          <CardBody>
            <div className="flex items-center gap-2 text-sm text-ink-2">
              <ShieldCheck className="size-4 text-success" /> Escrow-protected
            </div>
            <div className="mt-4 grid gap-1.5 text-sm">
              <div className="flex justify-between"><span className="text-ink-2">Creator rate</span><span className="text-ink">{formatNaira(gig.price_naira)}</span></div>
              {role === "brand" && <div className="flex justify-between"><span className="text-ink-2">Platform fee</span><span className="text-ink">{formatNaira(gig.fee_naira)}</span></div>}
              {role === "brand" && <div className="flex justify-between"><span className="text-ink-2">Tax</span><span className="text-ink">{formatNaira(gig.tax_naira ?? 0)}</span></div>}
            </div>

            {completed ? (
              <div className="mt-5 rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-ink">
                <Check className="mb-1 size-5 text-success" />
                Approved, escrow released{role === "creator" ? ". Your payout is on the way." : " to the creator."}
              </div>
            ) : canReview ? (
              <div className="mt-5 grid gap-2">
                <Button onClick={approve} loading={pending}><Check className="size-4" /> Approve &amp; release</Button>
                <Button variant="secondary" onClick={revise} loading={pending}><RotateCcw className="size-4" /> Request revision</Button>
                <p className="text-xs text-ink-3">Approving releases {formatNaira(gig.price_naira)} from escrow to the creator.</p>
              </div>
            ) : (
              <p className="mt-5 text-sm text-ink-3">
                {role === "creator"
                  ? deliverable ? "Waiting for the brand to review." : "Upload your draft to get started."
                  : "Waiting for the creator to submit a draft."}
              </p>
            )}

            {err && <p className="mt-3 text-sm text-error">{err}</p>}
          </CardBody>
        </Card>
      </aside>
    </div>
  );
}
