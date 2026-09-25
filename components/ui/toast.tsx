"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

// Дэлгэцийн доод хэсэгт товч мэдэгдэл гаргана.
// Ашиглах нь:  const toast = useToast();  toast("Хадгаллаа", "ok");
type Tone = "neutral" | "ok" | "bad";
type Toast = { id: number; text: string; tone: Tone };

const ToastContext = createContext<(text: string, tone?: Tone) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

const tones: Record<Tone, string> = {
  neutral: "bg-ink-900 text-white",
  ok: "bg-ok-700 text-white",
  bad: "bg-bad-600 text-white",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const reduce = useReducedMotion();

  const show = useCallback((text: string, tone: Tone = "neutral") => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, text, tone }]);
    // 2.6 секундын дараа өөрөө алга болно
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 2600);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-4"
        style={{ bottom: "calc(var(--bottom-nav-h) + 16px)" }}
      >
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "pointer-events-auto rounded-2xl px-4 py-3 text-[15px] font-semibold shadow-lift",
                tones[t.tone],
              )}
            >
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
