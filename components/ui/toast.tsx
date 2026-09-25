"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { cn } from "@/lib/cn";

// Дэлгэцийн доод хэсэгт товч мэдэгдэл. Ашиглах нь: const toast = useToast(); toast("Хадгаллаа", "ok");
type Tone = "neutral" | "ok" | "bad";
type Toast = { id: number; text: string; tone: Tone };

const ToastContext = createContext<(text: string, tone?: Tone) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

const tones: Record<Tone, string> = {
  neutral: "border-line bg-surface text-fg",
  ok: "border-good-fg/30 bg-good-bg text-good-fg",
  bad: "border-bad-fg/30 bg-bad-bg text-bad-fg",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const show = useCallback((text: string, tone: Tone = "neutral") => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, text, tone }]);
    // 3 секундын дараа өөрөө алга болно
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-4"
        style={{ bottom: "calc(var(--bottom-nav-h) + 16px)" }}
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto animate-fade-in rounded-lg border px-4 py-3 text-[15px] font-medium shadow-lift",
              tones[t.tone],
            )}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
