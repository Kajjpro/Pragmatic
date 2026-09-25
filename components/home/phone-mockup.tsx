"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { FeedCard } from "@/lib/types";
import { LawCard } from "@/components/feed/law-card";
import { cn } from "@/lib/cn";

// Нүүр хуудасны утасны макет — 3 картыг өөрөө эргүүлж харуулна.
// Хөдөлгөөн багасгах тохиргоотой бол өөрөө эргэхгүй, цэгүүдээр л сольж болно.
export function PhoneMockup({ cards }: { cards: FeedCard[] }) {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();
  const total = cards.length;

  useEffect(() => {
    if (reduce || total < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % total), 3800);
    return () => clearInterval(t);
  }, [reduce, total]);

  if (total === 0) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Утасны хүрээ */}
      <div className="relative w-[280px] rounded-[42px] bg-ink-950 p-3 shadow-lift sm:w-[320px]">
        {/* Дээд "хайрцаг" */}
        <div
          aria-hidden
          className="absolute left-1/2 top-3 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-ink-950"
        />
        <div className="relative h-[520px] overflow-hidden rounded-[32px] bg-brand-50 sm:h-[560px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={cards[index].id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: -40 }}
              transition={{ duration: reduce ? 0.15 : 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 p-2.5"
            >
              <LawCard card={cards[index]} compact />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Цэгүүд — дарж сольж болно */}
      <div className="flex items-center gap-2">
        {cards.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`${i + 1} дэх карт`}
            aria-current={i === index ? "true" : undefined}
            className={cn(
              "press h-2.5 rounded-full transition-all",
              i === index ? "w-7 bg-brand-600" : "w-2.5 bg-ink-300 hover:bg-ink-500",
            )}
          />
        ))}
      </div>
    </div>
  );
}
