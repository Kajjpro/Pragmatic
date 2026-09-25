"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, PartyPopper } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { FeedCard, QuizAnswerResult } from "@/lib/types";
import { LawCardView } from "./law-card-view";
import { QuizPanel } from "./quiz-panel";

const SWIPE_PX = 70; // үүнээс их хөндлөн чирвэл карт солино

// Stories хэлбэрийн карт: дээр хэсэгчилсэн явц, давхарласан картууд, өмнөх/дараах,
// сумны товчлуур (← →), гар утсанд хуруугаар чирж солино.
export function CardReader({
  cards,
  index,
  onIndexChange,
  viewedIds,
  isSignedIn,
  onCardViewed,
  onAnswered,
}: {
  cards: FeedCard[];
  index: number;
  onIndexChange: (i: number) => void;
  viewedIds: string[];
  isSignedIn: boolean;
  onCardViewed: (card: FeedCard) => void;
  onAnswered: (questionId: string, result: QuizAnswerResult) => void;
}) {
  const [quizOpen, setQuizOpen] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const viewed = useRef<Set<string>>(new Set());
  const drag = useRef<{ x: number; y: number; id: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const total = cards.length;
  const atEnd = index >= total;
  const card = atEnd ? null : cards[index];

  const go = useCallback(
    (delta: number) => {
      const next = Math.min(total, Math.max(0, index + delta));
      if (next === index) return;
      setQuizOpen(false);
      setDirection(delta > 0 ? 1 : -1);
      onIndexChange(next);
      cardRef.current?.focus({ preventScroll: true });
    },
    [total, index, onIndexChange],
  );

  // Карт анх харагдахад нэг удаа бүртгэнэ (+1 оноо өдөрт нэг удаа)
  useEffect(() => {
    if (card && !viewed.current.has(card.id)) {
      viewed.current.add(card.id);
      onCardViewed(card);
    }
  }, [card, onCardViewed]);

  // Сумны товчлуур (асуулт бөглөж байхад ажиллахгүй)
  useEffect(() => {
    if (quizOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, quizOpen]);

  // ── Хуруугаар чирэх ──
  function onPointerDown(e: React.PointerEvent) {
    if (quizOpen || e.pointerType === "mouse") return;
    if ((e.target as HTMLElement).closest("button, a, input, textarea, select")) return;
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || !cardRef.current) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) < Math.abs(e.clientY - d.y)) return; // босоо гүйлгэлт
    cardRef.current.style.transform = `translateX(${dx}px) rotate(${dx / 40}deg)`;
  }
  function onPointerEnd(e: React.PointerEvent) {
    const d = drag.current;
    drag.current = null;
    if (!d || !cardRef.current) return;
    cardRef.current.style.transform = "";
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(e.clientY - d.y)) go(dx < 0 ? 1 : -1);
  }

  return (
    <div>
      {/* Хэсэгчилсэн явц (Stories) */}
      <div className="flex items-center gap-3">
        <ol className="flex flex-1 gap-1" aria-label="Картын явц">
          {cards.map((c, i) => (
            <li key={c.id} className="flex-1">
              <button
                type="button"
                onClick={() => {
                  setDirection(i > index ? 1 : -1);
                  setQuizOpen(false);
                  onIndexChange(i);
                }}
                aria-label={`${i + 1}-р карт${viewedIds.includes(c.id) ? " (уншсан)" : ""}`}
                aria-current={i === index ? "step" : undefined}
                className="block w-full py-1.5"
              >
                <span
                  className={cn(
                    "block h-1 rounded-full transition-colors",
                    i === index ? "bg-primary" : viewedIds.includes(c.id) ? "bg-primary/40" : "bg-line",
                  )}
                />
              </button>
            </li>
          ))}
        </ol>
        <span className="shrink-0 text-[13.5px] tabular-nums text-muted" aria-live="polite">
          {atEnd ? `${total} / ${total}` : `${index + 1} / ${total}`}
        </span>
      </div>

      {/* Давхарласан картууд */}
      <div className="relative mt-4 pb-4">
        {!atEnd && index < total - 1 ? (
          <>
            <div aria-hidden className="absolute inset-x-6 bottom-0 top-6 rounded-2xl border border-line bg-surface/70" />
            <div aria-hidden className="absolute inset-x-3 bottom-2 top-3 rounded-2xl border border-line bg-surface/90" />
          </>
        ) : null}
        <div
          ref={cardRef}
          tabIndex={-1}
          aria-roledescription="карт"
          aria-label={card ? `Карт ${index + 1} / ${total}` : "Картууд дууслаа"}
          className="relative touch-pan-y rounded-2xl border border-line bg-surface p-5 shadow-lift outline-none transition-transform duration-150 sm:p-7"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          <div key={card?.id ?? "end"} className={direction > 0 ? "animate-slide-left" : "animate-slide-right"}>
            {card ? (
              quizOpen ? (
                <QuizPanel
                  questions={card.quiz}
                  isSignedIn={isSignedIn}
                  onAnswered={onAnswered}
                  onClose={() => setQuizOpen(false)}
                  onNextCard={() => go(1)}
                  hasNextCard={index < total - 1}
                />
              ) : (
                <LawCardView card={card} onStartQuiz={() => setQuizOpen(true)} />
              )
            ) : (
              <section className="py-6 text-center">
                <PartyPopper aria-hidden className="mx-auto h-10 w-10 text-gold" strokeWidth={1.5} />
                <h2 className="mt-3 text-[24px] font-bold">Өнөөдрийн бүх картыг уншлаа</h2>
                <p className="mx-auto mt-2 max-w-md text-muted">
                  Маргааш шинэ өөрчлөлтүүд нэмэгдэнэ. Одоохондоо санал хураалтын дүнг таамаглах эсвэл төсөлд санал өгөх боломжтой.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Link href="/predict" className={buttonClass("primary")}>
                    Таамаглах
                  </Link>
                  <Link href="/bills" className={buttonClass("secondary")}>
                    Хуулийн төслүүд
                  </Link>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Өмнөх / дараах */}
      <div className="mt-2 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={index === 0}
          className={buttonClass("secondary", "md", "rounded-full")}
        >
          <ChevronLeft aria-hidden className="h-4 w-4" /> Өмнөх
        </button>
        <p className="hidden items-center gap-1.5 text-[13px] text-muted sm:flex">
          <kbd className="rounded border border-line-strong bg-surface px-1.5 font-sans text-[12px]">←</kbd>
          <kbd className="rounded border border-line-strong bg-surface px-1.5 font-sans text-[12px]">→</kbd>
          товчоор шилжинэ
        </p>
        <button type="button" onClick={() => go(1)} disabled={atEnd} className={buttonClass("primary", "md", "rounded-full")}>
          Дараах <ChevronRight aria-hidden className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
