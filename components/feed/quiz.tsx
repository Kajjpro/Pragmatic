"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { QuizQuestionView } from "@/lib/types";
import { PointsPop } from "@/components/ui/points-pop";
import { cn } from "@/lib/cn";

// Нэг картын 3 асуулттай виктор.
// ДЕМО: зөв хариултыг lib/mock.ts-ээс авч байна. Dev 1-ийн
// POST /api/quiz/[id]/answer бэлэн болмогц тийш шилжинэ.
export function Quiz({
  questions,
  answers,
}: {
  questions: QuizQuestionView[];
  answers: Record<string, { correctIndex: number; explanation: string }>;
}) {
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [popFor, setPopFor] = useState<string | null>(null);
  const reduce = useReducedMotion();

  function choose(qId: string, index: number) {
    if (picked[qId] !== undefined) return; // нэг л удаа хариулна
    setPicked((s) => ({ ...s, [qId]: index }));
    if (answers[qId]?.correctIndex === index) {
      setPopFor(qId);
      setTimeout(() => setPopFor(null), 900);
    }
  }

  const answered = Object.keys(picked).length;
  const correct = Object.entries(picked).filter(
    ([qId, i]) => answers[qId]?.correctIndex === i,
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[17px] font-extrabold text-ink-950">
          Богино виктор
        </h3>
        <span className="text-[13.5px] font-bold tabular-nums text-ink-600">
          {answered} / {questions.length}
        </span>
      </div>

      {questions.map((q) => {
        const chosen = picked[q.id];
        const done = chosen !== undefined;
        const meta = answers[q.id];

        return (
          <div key={q.id} className="relative rounded-2xl border border-ink-200 bg-white p-4">
            <PointsPop points={3} show={popFor === q.id} />

            <p className="text-[15.5px] font-bold leading-snug text-ink-900">
              {q.question}
            </p>

            <div className="mt-3 flex flex-col gap-2">
              {q.options.map((opt, i) => {
                const isCorrect = done && meta?.correctIndex === i;
                const isWrongPick = done && chosen === i && !isCorrect;
                return (
                  <motion.button
                    key={opt}
                    type="button"
                    onClick={() => choose(q.id, i)}
                    disabled={done}
                    whileTap={reduce || done ? undefined : { scale: 0.985 }}
                    className={cn(
                      "min-h-12 rounded-xl border-2 px-4 py-2 text-left text-[15px] font-semibold transition-colors",
                      !done &&
                        "border-ink-200 text-ink-900 hover:border-brand-400 hover:bg-brand-50",
                      isCorrect && "border-ok-500 bg-ok-50 text-ok-800",
                      isWrongPick && "border-bad-600 bg-bad-50 text-bad-800",
                      done && !isCorrect && !isWrongPick && "border-ink-200 text-ink-500",
                    )}
                  >
                    <span className="mr-2 font-extrabold" aria-hidden>
                      {isCorrect ? "✓" : isWrongPick ? "✕" : String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </motion.button>
                );
              })}
            </div>

            {done && meta ? (
              <motion.p
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 rounded-xl bg-ink-50 p-3 text-[14px] leading-relaxed text-ink-700"
              >
                {meta.explanation}
              </motion.p>
            ) : null}
          </div>
        );
      })}

      {answered === questions.length ? (
        <div className="rounded-2xl bg-point-100 p-4 text-center">
          <p className="text-[16px] font-extrabold text-point-700">
            {correct} / {questions.length} зөв
          </p>
          <p className="mt-1 text-[14px] font-semibold text-ink-700">
            Нэвтэрсэн үед оноо хадгалагдана.
          </p>
        </div>
      ) : null}
    </div>
  );
}
