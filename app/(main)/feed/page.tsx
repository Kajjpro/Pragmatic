"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { LawCard } from "@/components/feed/law-card";
import { Quiz } from "@/components/feed/quiz";
import { EmptyState } from "@/components/ui/empty-state";
import { mockCards, mockQuizAnswers } from "@/lib/mock";
import { PERSONAS, personaLabels, type Persona } from "@/lib/types";
import { cn } from "@/lib/cn";

// ① Өнөөдрийн хууль — 60 секундийн картууд.
// ДЕМО: одоогоор lib/mock.ts-ээс уншиж байна.
// Dev 1-ийн GET /api/feed?persona=... бэлэн болмогц тийш шилжинэ.

// "Бүгд"-ийг эхэнд нь тавина
const filters: Persona[] = ["ALL", ...PERSONAS.filter((p) => p !== "ALL")];

export default function FeedPage() {
  const [persona, setPersona] = useState<Persona>("ALL");
  const reduce = useReducedMotion();

  // Сонгосон бүлэгт тохирох картуудыг шүүнэ
  const cards = useMemo(() => {
    if (persona === "ALL") return mockCards;
    return mockCards.filter((c) => c.personas.includes(persona));
  }, [persona]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-[28px] font-extrabold tracking-tight text-ink-950 sm:text-[34px]">
          Өнөөдрийн хууль
        </h1>
        <p className="mt-1.5 text-[15.5px] leading-relaxed text-ink-600">
          Нэг карт — 60 секунд. Уншаад богино викторт хариул.
        </p>
      </header>

      {/* Би хэн бэ? — хэрэглэгчийн бүлгийн шүүлтүүр */}
      <div className="mt-5">
        <h2 className="text-[12.5px] font-extrabold uppercase tracking-[0.12em] text-ink-600">
          Би хэн бэ?
        </h2>
        <div className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto pb-1">
          {filters.map((p) => {
            const active = persona === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPersona(p)}
                aria-pressed={active}
                className={cn(
                  "press min-h-11 shrink-0 rounded-full border-2 px-4 text-[14.5px] font-bold",
                  active
                    ? "border-brand-600 bg-brand-600 text-white shadow-brand"
                    : "border-ink-200 bg-white text-ink-700 hover:border-brand-400 hover:text-brand-700",
                )}
              >
                {personaLabels[p]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Картууд */}
      {cards.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            emoji="🔍"
            title="Энэ бүлэгт тохирох карт алга"
            description="Өөр бүлэг сонгоод үзээрэй. Шинэ хууль нэмэгдэх бүрт карт гарна."
          />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          {cards.map((card, i) => (
            <motion.section
              key={card.id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: reduce ? 0.2 : 0.45,
                delay: reduce ? 0 : Math.min(i * 0.05, 0.2),
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex flex-col gap-4"
            >
              <LawCard card={card} />
              <Quiz questions={card.quiz} answers={mockQuizAnswers} />
            </motion.section>
          ))}
        </div>
      )}
    </div>
  );
}
