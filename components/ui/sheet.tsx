"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// Доороос гарч ирэх хуудас (bottom sheet).
// Гар утсанд доошоо чирж хаана, компьютерт Esc дарж хаана.
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();

  // Esc товчоор хаах + нээлттэй үед ард нь гүйлгэхгүй байх
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* Бараан дэвсгэр — дарвал хаагдана */}
          <motion.button
            type="button"
            aria-label="Хаах"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-ink-950/55 backdrop-blur-[2px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            drag={reduce ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              // Хангалттай доошоо чирсэн бол хаана
              if (info.offset.y > 110) onClose();
            }}
            className="relative z-10 w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-lift sm:rounded-3xl"
          >
            {/* Чирэх бариул */}
            <div
              aria-hidden
              className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ink-200 sm:hidden"
            />
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-[19px] font-extrabold text-ink-900">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Хаах"
                className="press grid h-10 w-10 place-items-center rounded-full bg-ink-100 text-ink-700 hover:bg-ink-200"
              >
                ✕
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
