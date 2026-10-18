"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Paperclip, Send, Loader2, FileText, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { sendMessage, signAttachment, type ChatMessage } from "@/app/messages/actions";

const MAX_BYTES = 10 * 1024 * 1024;
const OK_TYPES = /^(image\/|application\/pdf)/;

function timeOf(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
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
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

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

  function add(m: ChatMessage) {
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  }

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
    if (!OK_TYPES.test(file.type)) return setWarn("Only images and PDFs can be attached.");
    if (file.size > MAX_BYTES) return setWarn("Attachments must be under 10MB.");
    if (!supabaseConfigured) return;

    setUploading(true);
    const supabase = createClient();
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
    const path = `${conversationId}/${Date.now()}_${safe}`;
    const { error } = await supabase.storage.from("chat").upload(path, file, { cacheControl: "60" });
    if (error) {
      setUploading(false);
      setWarn(error.message);
      return;
    }
    const r = await sendMessage({ conversationId, body: "", attachmentUrl: path, attachmentName: file.name });
    setUploading(false);
    if (r.error) setWarn(r.error);
    else if (r.message) add(r.message);
  }

  async function openAttachment(path: string) {
    const r = await signAttachment(path);
    if (r.url) window.open(r.url, "_blank", "noopener");
    else setWarn(r.error ?? "Could not open attachment.");
  }

  return (
    <div className="flex h-[32rem] flex-col rounded-2xl border border-line bg-surface">
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
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[78%] rounded-2xl px-3.5 py-2 text-sm", mine ? "bg-accent text-accent-ink" : "bg-surface-2 text-ink")}>
                {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                {m.attachment_url && (
                  <button
                    onClick={() => openAttachment(m.attachment_url!)}
                    className={cn("mt-1 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium", mine ? "bg-accent-ink/15" : "bg-surface")}
                  >
                    <FileText className="size-3.5" /> {m.attachment_name || "Attachment"}
                  </button>
                )}
                <span className={cn("mt-0.5 block text-[10px]", mine ? "text-accent-ink/70" : "text-ink-3")}>
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
          aria-label="Attach"
          className="grid size-9 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-surface-2 hover:text-ink"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
        </button>
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
          className="h-10 flex-1 rounded-full border border-line bg-surface px-4 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-tint"
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
