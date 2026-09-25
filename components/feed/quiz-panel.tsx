"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { QuizAnswerResult, QuizQuestionView } from "@/lib/types";
import { postQuizAnswer } from "./feed-data";

// Ойлголт шалгах: нэг удаад нэг асуулт → "Хариулах" → зөв/буруу + тайлбар → дүн.
export function QuizPanel({
  questions,
  isSignedIn,
  onAnswered,
  onClose,
  onNextCard,
  hasNextCard,
}: {
  questions: QuizQuestionView[];
  isSignedIn: boolean;
  onAnswered: (questionId: string, result: QuizAnswerResult) => void;
  onClose: () => void;
  onNextCard: () => void;
  hasNextCard: boolean;
}) {
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [result, setResult] = useState<QuizAnswerResult | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const done = step >= questions.length;
  const q = questions[step];

  async function answer() {
    if (choice === null || !q) return;
    setSending(true);
    setError(null);
    try {
      const r = await postQuizAnswer(q.id, choice);
      setResult(r);
      if (r.correct) setCorrectCount((n) => n + 1);
      onAnswered(q.id, r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Хариуг шалгаж чадсангүй.");
    } finally {
      setSending(false);
    }
  }

  function next() {
    setStep((s) => s + 1);
    setChoice(null);
    setResult(null);
  }

  if (done) {
    return (
      <section aria-live="polite" className="flex flex-col gap-4">
        <h2 className="text-[22px] font-bold">
          {questions.length}-аас <span className="tabular-nums">{correctCount}</span> зөв
        </h2>
        <p className="text-muted">Ойлголтоо шалгасанд баярлалаа.</p>
        {!isSignedIn ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface-2 px-4 py-3 text-[15px]">
            <span className="text-muted">Оноо, дараалсан өдрөө хадгалахын тулд нэвтэрнэ үү.</span>
            <SignInButton mode="modal">
              <button type="button" className="min-h-9 rounded-md border border-line-strong bg-surface px-3.5 text-[14px] font-semibold hover:border-primary">
                Нэвтрэх
              </button>
            </SignInButton>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-3">
          {hasNextCard ? <Button onClick={onNextCard}>Дараагийн карт</Button> : null}
          <Button variant="secondary" onClick={onClose}>
            Карт руу буцах
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Ойлголтоо шалгах" className="flex flex-col gap-4">
      <p className="text-[14px] text-muted">
        Асуулт <span className="tabular-nums">{step + 1}</span> / <span className="tabular-nums">{questions.length}</span>
      </p>
      <fieldset disabled={result !== null || sending}>
        <legend className="font-serif text-[20px] font-bold text-heading">{q.question}</legend>
        <div className="mt-4 flex flex-col gap-2">
          {q.options.map((option, i) => {
            const isCorrect = result && i === result.correctIndex;
            const isWrongPick = result && i === choice && !result.correct;
            return (
              <label
                key={i}
                className={cn(
                  "flex min-h-12 cursor-pointer items-center gap-3 rounded-md border px-4 py-2",
                  isCorrect ? "border-good-fg bg-good-bg" : isWrongPick ? "border-bad-fg bg-bad-bg" : "border-line has-[:checked]:border-primary",
                )}
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  checked={choice === i}
                  onChange={() => setChoice(i)}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                <span className="flex-1 text-[16px]">{option}</span>
                {isCorrect ? <CheckCircle2 aria-label="зөв хариулт" className="h-5 w-5 text-good-fg" /> : null}
                {isWrongPick ? <XCircle aria-label="таны сонголт буруу" className="h-5 w-5 text-bad-fg" /> : null}
              </label>
            );
          })}
        </div>
      </fieldset>

      {error ? <p className="text-[14px] text-bad-fg">{error}</p> : null}

      {result ? (
        <div aria-live="polite" className="rounded-md border-l-2 border-primary bg-surface-2 px-4 py-3">
          <p className={cn("font-semibold", result.correct ? "text-good-fg" : "text-bad-fg")}>
            {result.correct ? "Зөв байна." : "Буруу байна."}
            {result.pointsAwarded > 0 ? <span className="ml-2 text-[14px] font-normal text-muted">+{result.pointsAwarded} оноо</span> : null}
          </p>
          <p className="mt-1 text-[15.5px]">{result.explanation}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {result ? (
          <Button onClick={next}>{step + 1 < questions.length ? "Дараагийн асуулт" : "Дүнг харах"}</Button>
        ) : (
          <Button onClick={answer} disabled={choice === null || sending}>
            {sending ? "Шалгаж байна…" : "Хариулах"}
          </Button>
        )}
        <Button variant="ghost" onClick={onClose}>
          Карт руу буцах
        </Button>
      </div>
    </section>
  );
}
