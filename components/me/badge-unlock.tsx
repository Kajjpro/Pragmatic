"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Confetti } from "@/components/feed/confetti";
import { ShareButton } from "./share-button";
import { badgeLabels, type Badge } from "@/lib/types";

// ⑥ "Би хууль өөрчилсөн" — бүтэн дэлгэцийн нээлтийн мөч.
// Зөвхөн шинэ тэмдэг авсан үед нэг л удаа гарна.
export function BadgeUnlock({
  badge,
  onClose,
}: {
  badge: Badge | null;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const label = badge ? badgeLabels[badge.type] : null;

  return (
    <AnimatePresence>
      {badge && label ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={label.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="chrome-brand fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto p-5"
        >
          <div className="grain" aria-hidden />
          <Confetti />

          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: reduce ? 0.2 : 0.45,
              ease: [0.22, 1, 0.36, 1],
              delay: reduce ? 0 : 0.1,
            }}
            className="relative w-full max-w-sm text-center text-white"
          >
            <motion.div
              animate={reduce ? {} : { scale: [1, 1.12, 1] }}
              transition={{ duration: 1.6, repeat: reduce ? 0 : Infinity, ease: "easeInOut" }}
              className="text-[84px] leading-none"
              aria-hidden
            >
              {label.emoji}
            </motion.div>

            <p className="mt-3 text-[13px] font-extrabold uppercase tracking-[0.18em] text-point-400">
              Шинэ тэмдэг
            </p>
            <h2 className="mt-2 text-[30px] font-extrabold leading-tight tracking-tight">
              {label.title}
            </h2>

            {badge.lawTitle ? (
              <div className="mt-5 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                <p className="text-[15px] font-semibold leading-relaxed text-white/90">
                  {badge.lawTitle}
                </p>
                {badge.clauseNumber ? (
                  <p className="mt-1.5 font-mono text-[14px] font-bold text-point-400">
                    {badge.clauseNumber} дугаар заалт
                  </p>
                ) : null}
              </div>
            ) : null}

            <p className="mt-4 text-[15.5px] leading-relaxed text-white/85">
              Таны санал хуульд тусгагдлаа.
            </p>

            <div className="mt-7 flex flex-col gap-2.5">
              <ShareButton
                url={`/b/${badge.id}`}
                text="Миний санал хуульд тусгагдлаа."
                className="press min-h-14 w-full rounded-2xl bg-point-400 text-[16.5px] font-extrabold text-ink-950 shadow-point hover:bg-point-500"
              >
                Хуваалцах
              </ShareButton>
              <button
                type="button"
                onClick={onClose}
                className="press min-h-12 w-full rounded-2xl border-2 border-white/30 text-[15px] font-bold text-white hover:bg-white/10"
              >
                Үргэлжлүүлэх
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
