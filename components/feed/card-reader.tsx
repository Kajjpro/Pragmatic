"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import type { FeedCard, QuizAnswerResult } from "@/lib/types";
import { LawCardView } from "./law-card-view";
import { QuizPanel } from "./quiz-panel";

const SWIPE_PX = 60; // үүнээс их хөндлөн шударвал карт солино

// Картыг хуудаслан унших: "3 / 10", өмнөх/дараах товч, сумны товчлуур, гар утсанд шударна.
export function CardReader({
  cards,
  index,
  onIndexChange,
  isSignedIn,
  onCardViewed,
  onAnswered,
}: {
  cards: FeedCard[];
  index: number;
  onIndexChange: (i: number) => void;
  isSignedIn: boolean;
  onCardViewed: (card: FeedCard) => void;
  onAnswered: (questionId: string, result: QuizAnswerResult) => void;
}) {
  const [quizOpen, setQuizOpen] = useState(false);
  const viewed = useRef<Set<string>>(new Set());
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const regionRef = useRef<HTMLDivElement>(null);

  const total = cards.length;
  const atEnd = index >= total;
  const card = atEnd ? null : cards[index];

  const go = useCallback(
    (delta: number) => {
      const next = Math.min(total, Math.max(0, index + delta));
      if (next === index) return;
      setQuizOpen(false);
      onIndexChange(next);
      regionRef.current?.focus();
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

  return (
    <div>
      {/* Явц */}
      <div className="flex items-center gap-3">
        <span className="text-[14px] tabular-nums text-muted" aria-live="polite">
          {atEnd ? `${total} / ${total}` : `${index + 1} / ${total}`}
        </span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-line" aria-hidden>
          <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${(Math.min(index + 1, total) / total) * 100}%` }} />
        </div>
      </div>

      <div
        ref={regionRef}
        tabIndex={-1}
        aria-roledescription="карт"
        aria-label={card ? `Карт ${index + 1} / ${total}` : "Картууд дууслаа"}
        className="mt-4 rounded-lg border border-line bg-surface p-5 outline-none sm:p-7"
        onTouchStart={(e) => {
          const t = e.touches[0];
          touchStart.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          const start = touchStart.current;
          touchStart.current = null;
          if (!start || quizOpen) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - start.x;
          const dy = t.clientY - start.y;
          if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
        }}
      >
        <div key={card?.id ?? "end"} className="animate-fade-in">
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
            <section className="py-4">
              <h2 className="text-[23px] font-bold">Өнөөдрийн бүх картыг уншлаа</h2>
              <p className="mt-2 text-muted">Маргааш шинэ өөрчлөлтүүд нэмэгдэнэ. Одоохондоо хуулийн бүтэн харьцуулалт эсвэл санал хураалтын таамгийг үзэж болно.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/bills" className={buttonClass("primary")}>
                  Хуулийн өөрчлөлтүүд
                </Link>
                <Link href="/predict" className={buttonClass("secondary")}>
                  Таамаг
                </Link>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Өмнөх / дараах */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => go(-1)} disabled={index === 0}>
          <ChevronLeft aria-hidden className="h-4 w-4" /> Өмнөх
        </Button>
        <p className="hidden text-[13px] text-muted sm:block">Гарын ← → товчоор шилжинэ</p>
        <Button variant="secondary" onClick={() => go(1)} disabled={atEnd}>
          Дараах <ChevronRight aria-hidden className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
