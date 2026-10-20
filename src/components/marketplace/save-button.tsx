"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleSaveCreator } from "@/app/creators/save-actions";

/**
 * Heart "save" (like) control. On cards it's a small overlay; on the profile a
 * labelled button. Optimistic, reverts on error.
 */
export function SaveButton({
  creatorId,
  initialSaved = false,
  variant = "overlay",
}: {
  creatorId: string;
  initialSaved?: boolean;
  variant?: "overlay" | "button";
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, start] = useTransition();
  const [note, setNote] = useState<string | null>(null);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !saved;
    setSaved(next);
    setNote(null);
    start(async () => {
      const r = await toggleSaveCreator(creatorId);
      if (r.error) {
        setSaved(!next);
        if (r.needsBrand) router.push("/login");
        else setNote(r.error);
      } else {
        setSaved(!!r.saved);
      }
    });
  }

  if (variant === "button") {
    return (
      <button
        onClick={toggle}
        disabled={pending}
        aria-pressed={saved}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
          saved ? "border-accent bg-accent-tint text-accent-hover" : "border-line text-ink-2 hover:border-accent hover:text-accent",
        )}
      >
        <Heart className={cn("size-4", saved && "fill-accent text-accent")} /> {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-label={saved ? "Unsave creator" : "Save creator"}
      aria-pressed={saved}
      title={note ?? (saved ? "Saved" : "Save")}
      className="grid size-8 place-items-center rounded-full bg-chalk/90 text-ink shadow-sm backdrop-blur transition-colors hover:bg-chalk"
    >
      <Heart className={cn("size-4", saved ? "fill-accent text-accent" : "text-ink-3")} />
    </button>
  );
}
