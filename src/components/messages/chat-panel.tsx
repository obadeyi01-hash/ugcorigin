"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { Paperclip, Send, Loader2, FileText, ShieldAlert, Download, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import {
  sendMessage,
  signChatUpload,
  resolveChatAttachments,
  type ChatMessage,
  type ResolvedAttachment,
} from "@/app/messages/actions";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import { attachmentKindFromRef, type AttachmentKind } from "@/lib/cloudinary";
import { validateFile } from "@/lib/upload-limits";
import { VoiceRecorder } from "@/components/messages/voice-recorder";

function timeOf(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function kindOf(m: ChatMessage): AttachmentKind {
  if (m.attachment_kind) return m.attachment_kind;
  return m.attachment_url ? attachmentKindFromRef(m.attachment_url, m.attachment_name) : "file";
}

export function ChatPanel({
  conversationId,
  currentUserId,
  otherName,
  canShareContact,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  otherName: string;
  canShareContact: boolean;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [resolved, setResolved] = useState<Record<string, ResolvedAttachment>>({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  // Resolve any unresolved attachment refs into signed preview + download URLs,
  // in one batched round-trip whenever the thread changes.
  useEffect(() => {
    const pending = messages
      .filter((m) => m.attachment_url && !resolved[m.attachment_url])
      .map((m) => ({ ref: m.attachment_url as string, name: m.attachment_name, kind: m.attachment_kind }));
    if (pending.length === 0) return;
    let cancelled = false;
    (async () => {
      const r = await resolveChatAttachments(conversationId, pending);
      if (!cancelled && r.map) setResolved((prev) => ({ ...prev, ...r.map }));
    })();
    return () => {
      cancelled = true;
    };
  }, [messages, conversationId, resolved]);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();
    // Unique topic per mount so React's dev double-invoke never reuses a
    // subscribed channel.
    const channel = supabase
      .channel(`chat:${conversationId}:${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const add = useCallback((m: ChatMessage) => {
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  }, []);

  async function doSend() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setWarn(null);
    const r = await sendMessage({ conversationId, body });
    setSending(false);
    if (r.error) {
      setWarn(r.error);
      return;
    }
    setText("");
    if (r.message) add(r.message);
    if (r.redacted) setWarn("Contact details were hidden. You can share them once a contract is funded.");
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setWarn(null);
    const check = validateFile(file, "chat");
    if (!check.ok) return setWarn(check.error);

    setUploading(true);
    try {
      const sig = await signChatUpload(conversationId);
      if (sig.error || !sig.upload) throw new Error(sig.error || "Could not start upload.");
      const up = await uploadToCloudinary(file, sig.upload);
      const kind = attachmentKindFromRef(up.ref, file.name);
      const r = await sendMessage({ conversationId, body: "", attachmentUrl: up.ref, attachmentName: file.name, attachmentKind: kind });
      if (r.error) setWarn(r.error);
      else if (r.message) add(r.message);
    } catch (e) {
      setWarn(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function onVoice(file: File, seconds: number) {
    const sig = await signChatUpload(conversationId);
    if (sig.error || !sig.upload) throw new Error(sig.error || "Could not start upload.");
    const up = await uploadToCloudinary(file, sig.upload);
    const mm = Math.floor(seconds / 60);
    const ss = Math.floor(seconds % 60).toString().padStart(2, "0");
    const r = await sendMessage({
      conversationId,
      body: "",
      attachmentUrl: up.ref,
      attachmentName: `Voicebite · ${mm}:${ss}`,
      attachmentKind: "audio",
    });
    if (r.error) throw new Error(r.error);
    if (r.message) add(r.message);
  }

  return (
    <div className="flex h-[min(80vh,34rem)] flex-col rounded-2xl border border-line bg-surface">
      <div className="border-b border-line px-4 py-3">
        <p className="font-semibold text-ink">{otherName}</p>
        {!canShareContact && (
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-warning">
            <ShieldAlert className="size-3.5" /> Keep it on-platform. Phone numbers, emails and links are hidden until a contract is funded.
          </p>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && <p className="py-8 text-center text-sm text-ink-3">No messages yet. Say hello.</p>}
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          const att = m.attachment_url ? resolved[m.attachment_url] : undefined;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[80%] rounded-2xl px-3.5 py-2 text-sm", mine ? "bg-accent text-accent-ink" : "bg-surface-2 text-ink")}>
                {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                {m.attachment_url && (
                  <Attachment message={m} att={att} mine={mine} />
                )}
                <span className={cn("mt-0.5 block text-2xs", mine ? "text-accent-ink/70" : "text-ink-3")}>
                  {timeOf(m.created_at)}
                  {m.flagged && " · contact hidden"}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {warn && <p className="border-t border-line px-4 py-2 text-xs text-warning">{warn}</p>}

      <div className="flex items-center gap-2 border-t border-line p-3">
        <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={onFile} className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          aria-label="Attach a file"
          title="Attach an image or PDF"
          className="grid size-9 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-surface-2 hover:text-ink disabled:opacity-50"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
        </button>
        <VoiceRecorder onSend={onVoice} disabled={uploading || sending} />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              doSend();
            }
          }}
          placeholder="Write a message…"
          className="h-10 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-tint"
        />
        <button
          onClick={doSend}
          disabled={sending || !text.trim()}
          aria-label="Send"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-ink disabled:opacity-50"
        >
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------- attachment ------------------------------- */

function Attachment({ message, att, mine }: { message: ChatMessage; att?: ResolvedAttachment; mine: boolean }) {
  const kind = kindOf(message);
  const name = message.attachment_name || "Attachment";
  const chipBg = mine ? "bg-accent-ink/15" : "bg-surface";

  if (!att) {
    return (
      <div className={cn("mt-1 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs", chipBg)}>
        <Loader2 className="size-3.5 animate-spin" /> {kind === "audio" ? "Voicebite" : name}
      </div>
    );
  }

  if (kind === "image") {
    return (
      <div className="mt-1.5">
        <a href={att.url} target="_blank" rel="noopener noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={att.url} alt={name} className="max-h-60 w-auto max-w-full rounded-lg border border-line object-cover" />
        </a>
        <DownloadLink url={att.downloadUrl} label="Save image" mine={mine} />
      </div>
    );
  }

  if (kind === "video") {
    return (
      <div className="mt-1.5">
        <video src={att.url} controls preload="metadata" playsInline className="max-h-72 w-full rounded-lg border border-line bg-obsidian" />
        <DownloadLink url={att.downloadUrl} label="Save video" mine={mine} />
      </div>
    );
  }

  if (kind === "audio") {
    return (
      <div className={cn("mt-1.5 flex items-center gap-2 rounded-xl px-2 py-1.5", chipBg)}>
        <Mic className={cn("size-4 shrink-0", mine ? "text-accent-ink" : "text-accent")} />
        <audio src={att.url} controls preload="metadata" className="h-9 max-w-[200px]" />
      </div>
    );
  }

  // file (PDF, etc.)
  return (
    <a
      href={att.downloadUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("mt-1 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium hover:underline", chipBg)}
    >
      <FileText className="size-3.5" /> {name} <Download className="size-3.5" />
    </a>
  );
}

function DownloadLink({ url, label, mine }: { url: string; label: string; mine: boolean }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("mt-1 inline-flex items-center gap-1 text-2xs font-medium hover:underline", mine ? "text-accent-ink/80" : "text-ink-3")}
    >
      <Download className="size-3" /> {label}
    </a>
  );
}
