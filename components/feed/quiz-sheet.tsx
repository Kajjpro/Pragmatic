"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Sheet } from "@/components/ui/sheet";
import { PointsPop } from "@/components/ui/points-pop";
import { Confetti } from "./confetti";
import { postQuizAnswer } from "./feed-data";
import type { QuizAnswerResult, QuizQuestionView } from "@/lib/types";
import { cn } from "@/lib/cn";

type Feedback = {
  chosen: number;
  correct: boolean;
  correctIndex: number;
  explanation: string;
};

// Нэг картын 3 асуулт. Нэг нэгээр нь харуулна.
export function QuizSheet({
  open,
  onClose,
  questions,
  onAnswered,
  onFinished,
  hasNextCard,
  onNextCard,
}: {
  open: boolean;
  onClose: () => void;
  questions: QuizQuestionView[];
  onAnswered: (questionId: string, result: QuizAnswerResult) => void;
  onFinished: () => void;
  hasNextCard: boolean;
  onNextCard: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const [pop, setPop] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const reduce = useReducedMotion();

  // Карт сонгоогүй үед асуулт ирэхгүй. Sheet-ийн хүүхдүүд хаалттай үед ч
  // тооцогддог тул энд эрт зогсоохгүй бол questions[0] undefined болно.
  if (questions.length === 0) return null;

  const q = questions[index];
  const last = index === questions.length - 1;

  async function choose(i: number) {
    if (feedback || busy) return;
    setBusy(true);
    setFailed(null);
    try {
      const res = await postQuizAnswer(q.id, i);
      setFeedback({
        chosen: i,
        correct: res.correct,
        correctIndex: res.correctIndex,
        explanation: res.explanation,
      });
      onAnswered(q.id, res);
      if (res.correct) {
        setCorrectCount((c) => c + 1);
        // Оноо зөвхөн нэвтэрсэн, анхны зөв оролдлогод өгөгдөнө
        if (res.pointsAwarded > 0) {
          setPop(true);
          setTimeout(() => setPop(false), 900);
        }
      }
    } catch (e) {
      // Асуултыг түгжихгүй — дахин дарж болно
      setFailed(e instanceof Error ? e.message : "Хариуг шалгаж чадсангүй");
    } finally {
      setBusy(false);
    }
  }

  function next() {
    // Сүүлийн асуулт байсан бол дүнгийн дэлгэц рүү шилжинэ
    if (last) {
      setDone(true);
      onFinished();
      return;
    }
    setIndex((i) => i + 1);
    setFeedback(null);
  }

  // Хаагдахад дараагийн удаад шинээр эхлэхээр цэвэрлэнэ
  function close() {
    onClose();
    setTimeout(() => {
      setIndex(0);
      setFeedback(null);
      setCorrectCount(0);
      setDone(false);
      setFailed(null);
    }, 250);
  }

  return (
    <Sheet open={open} onClose={close} title={done ? "Дүн" : "3 асуулт"}>
      {done ? (
        <div className="relative pb-2 text-center">
          <Confetti />
          <div className="relative pt-6">
            <div className="text-[52px] leading-none" aria-hidden>
              {correctCount === questions.length ? "🎉" : "👏"}
            </div>
            <p className="mt-3 text-[30px] font-extrabold tabular-nums text-ink-950">
              {correctCount}/{questions.length}
            </p>
            <p className="mt-1 text-[15px] font-semibold text-ink-600">
              {correctCount === questions.length
                ? "Бүгдийг зөв хариуллаа!"
                : "Сайн байна — тайлбарыг дахин уншаарай."}
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              {hasNextCard ? (
                <button
                  type="button"
                  onClick={() => {
                    close();
                    onNextCard();
                  }}
                  className="press min-h-14 w-full rounded-2xl bg-brand-600 text-[16px] font-extrabold text-white shadow-brand hover:bg-brand-700"
                >
                  Дараагийн хууль →
                </button>
              ) : null}
              <button
                type="button"
                onClick={close}
                className="press min-h-12 w-full rounded-2xl bg-ink-100 text-[15px] font-bold text-ink-700 hover:bg-ink-200"
              >
                Хаах
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <PointsPop points={3} show={pop} />

          {/* Явц */}
          <div className="flex items-center gap-2">
            {questions.map((item, i) => (
              <span
                key={item.id}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  i < index ? "bg-brand-600" : i === index ? "bg-brand-400" : "bg-ink-200",
                )}
              />
            ))}
            <span className="ml-1 shrink-0 text-[13px] font-bold tabular-nums text-ink-600">
              {index + 1}/{questions.length}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={q.id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
              transition={{ duration: reduce ? 0.15 : 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="mt-4 text-[18px] font-extrabold leading-snug text-ink-950">
                {q.question}
              </p>

              <div className="mt-4 flex flex-col gap-2.5">
                {q.options.map((opt, i) => {
                  const isCorrect = feedback && feedback.correctIndex === i;
                  const isWrong = feedback && feedback.chosen === i && !feedback.correct;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => choose(i)}
                      disabled={Boolean(feedback) || busy}
                      className={cn(
                        "min-h-14 rounded-2xl border-2 px-4 py-3 text-left text-[16px] font-semibold transition-colors",
                        !feedback &&
                          "border-ink-200 text-ink-900 hover:border-brand-500 hover:bg-brand-50",
                        isCorrect && "border-ok-500 bg-ok-50 text-ok-800",
                        isWrong && "border-bad-600 bg-bad-50 text-bad-800",
                        feedback && !isCorrect && !isWrong && "border-ink-200 text-ink-500",
                      )}
                    >
                      <span className="mr-2 font-extrabold" aria-hidden>
                        {isCorrect ? "✓" : isWrong ? "✕" : String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {failed ? (
                <p
                  role="alert"
                  className="mt-3 rounded-2xl border-2 border-bad-100 bg-bad-50 p-3 text-[14.5px] font-semibold text-bad-800"
                >
                  {failed} — дахин дарна уу.
                </p>
              ) : null}

              {feedback ? (
                <motion.div
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  {feedback.explanation ? (
                    <p className="rounded-2xl bg-ink-50 p-3.5 text-[15px] leading-relaxed text-ink-700">
                      {feedback.explanation}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={next}
                    className="press mt-3 min-h-14 w-full rounded-2xl bg-brand-600 text-[16px] font-extrabold text-white shadow-brand hover:bg-brand-700"
                  >
                    {last ? "Дүнг харах →" : "Дараах асуулт →"}
                  </button>
                </motion.div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </Sheet>
  );
}
