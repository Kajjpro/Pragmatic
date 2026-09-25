"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// Оноо авахад "+3" гэж хөвж гарах анимаци.
// show=true болоход дээш хөвж, аажим алга болно.
export function PointsPop({
  points,
  show,
}: {
  points: number;
  show: boolean;
}) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          // Хөдөлгөөн багасгах тохиргоотой бол зөвхөн бүдгэрч харагдана
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.8 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: -28, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.15 : 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
          aria-hidden
        >
          <span className="inline-flex items-center rounded-full bg-point-400 px-3 py-1 text-[15px] font-extrabold text-ink-950 shadow-point">
            +{points}
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
