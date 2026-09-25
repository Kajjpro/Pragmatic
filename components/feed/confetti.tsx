"use client";

import { motion, useReducedMotion } from "framer-motion";

// Хөнгөн конфетти — нэмэлт сан ашиглаагүй, ердөө 22 жижиг дөрвөлжин.
// Хөдөлгөөн багасгах тохиргоотой бол огт харуулахгүй.
const COLORS = ["#7c3aed", "#fbbf24", "#10b981", "#a78bfa", "#f59e0b"];

// Санамсаргүй боловч тогтвортой байхаар индексээс тооцно (SSR зөрүү гарахгүй)
const pieces = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: (((i * 37) % 100) - 50) * 2.6, // -130 .. 130
  delay: (i % 6) * 0.045,
  rotate: ((i * 53) % 180) - 90,
  color: COLORS[i % COLORS.length],
}));

export function Confetti() {
  const reduce = useReducedMotion();
  if (reduce) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden"
      aria-hidden
    >
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, y: -10, x: 0, rotate: 0 }}
          animate={{ opacity: 0, y: 150, x: p.x, rotate: p.rotate }}
          transition={{ duration: 1.5, delay: p.delay, ease: "easeOut" }}
          className="absolute left-1/2 top-0 h-2.5 w-2 rounded-[2px]"
          style={{ background: p.color }}
        />
      ))}
    </div>
  );
}
