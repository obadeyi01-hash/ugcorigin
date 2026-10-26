"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Tone = "info" | "success" | "warning" | "error";
type Toast = { id: number; tone: Tone; title: string };

const ToastContext = createContext<(title: string, tone?: Tone) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

const tones: Record<Tone, string> = {
  info: "border-line bg-surface",
  success: "border-success/30 bg-surface",
  warning: "border-warning/40 bg-surface",
  error: "border-error/40 bg-surface",
};

/** Short popup for a result that should not stay on the page. */
export function Toaster({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((title: string, tone: Tone = "info") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((list) => [...list, { id, tone, title }]);
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 4200);
  }, []);
  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(100%-2rem,22rem)] flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} role="status" className={`pointer-events-auto rounded-2xl border px-4 py-3 text-sm font-medium text-ink shadow-lg ${tones[t.tone]}`}>
            {t.title}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
