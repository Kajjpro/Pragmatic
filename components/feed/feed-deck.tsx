"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { FeedCard as Card } from "@/lib/types";
import { FeedCard } from "./feed-card";
import { FeedEnd } from "./feed-end";
import { PointsPop } from "@/components/ui/points-pop";
import { cn } from "@/lib/cn";

// Босоо свайпын тавцан.
// Гар утас: дээш/доош чирнэ. Компьютер: сумны товч эсвэл дээд/доод товчлуур.
// Сүүлийн картын дараа "дууслаа" дэлгэц харагдана (index === cards.length).
export function FeedDeck({
  cards,
  index,
  onIndexChange,
  streak,
  paused,
  onOpenQuiz,
  onCardViewed,
  pointsPop,
}: {
  cards: Card[];
  index: number;
  onIndexChange: (i: number) => void;
  streak: number;
  paused: boolean; // хуудас (sheet) нээлттэй үед товчлуур ажиллахгүй
  onOpenQuiz: (card: Card) => void;
  onCardViewed: (card: Card) => void;
  pointsPop: boolean;
}) {
  const [dir, setDir] = useState(1);
  const reduce = useReducedMotion();
  const viewed = useRef<Set<string>>(new Set());
  const slideRef = useRef<HTMLDivElement>(null);
  // Картын текст дэлгэцэнд багтаж байгаа эсэх. Багтахгүй бол хуруугаар
  // гүйлгэх нь чухал тул свайпыг унтрааж, ↑/↓ товчоор солино.
  const [fits, setFits] = useState(true);

  const total = cards.length;
  const atEnd = index >= total;

  const go = useCallback(
    (delta: number) => {
      const next = Math.min(total, Math.max(0, index + delta));
      if (next === index) return;
      setDir(delta > 0 ? 1 : -1);
      onIndexChange(next);
    },
    [total, index, onIndexChange],
  );

  // Сумны товчоор шилжих
  useEffect(() => {
    if (paused) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, paused]);

  // Карт багтаж байгаа эсэхийг хэмжинэ (карт солигдох, цонх өөрчлөгдөх бүрт)
  useEffect(() => {
    const measure = () => {
      const el = slideRef.current?.querySelector<HTMLElement>("[data-card-scroll]");
      setFits(el ? el.scrollHeight <= el.clientHeight + 1 : true);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [index, cards]);

  // Карт харагдмагц бүртгэнэ (богино хүлээлттэй — хурдан гүйлгэхэд тоолохгүй)
  useEffect(() => {
    if (atEnd) return;
    const card = cards[index];
    if (!card || viewed.current.has(card.id)) return;
    const t = setTimeout(() => {
      viewed.current.add(card.id);
      onCardViewed(card);
    }, 600);
    return () => clearTimeout(t);
  }, [index, atEnd, cards, onCardViewed]);

  // Картын жагсаалт солигдоход "үзсэн" тэмдэглэгээг цэвэрлэнэ
  useEffect(() => {
    viewed.current = new Set();
  }, [cards]);

  const slideIn = reduce
    ? { opacity: 0 }
    : { opacity: 0, y: dir > 0 ? 70 : -70, scale: 0.98 };
  const slideOut = reduce
    ? { opacity: 0 }
    : { opacity: 0, y: dir > 0 ? -70 : 70, scale: 0.98 };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Явцын цэгүүд + тоолуур */}
      <div className="flex shrink-0 items-center gap-3 px-1 pb-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-1">
          {cards.map((c, i) => (
            <span
              key={c.id}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i < index ? "bg-brand-600" : i === index ? "bg-brand-400" : "bg-ink-200",
              )}
            />
          ))}
        </div>
        <span className="shrink-0 text-[13px] font-extrabold tabular-nums text-ink-600">
          {Math.min(index + 1, total)} / {total}
        </span>
      </div>

      {/* Тавцан */}
      <div className="relative min-h-0 flex-1">
        <PointsPop points={1} show={pointsPop} />

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={atEnd ? "__end__" : cards[index].id}
            initial={slideIn}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={slideOut}
            transition={{ duration: reduce ? 0.15 : 0.32, ease: [0.22, 1, 0.36, 1] }}
            ref={slideRef}
            // Гар утсанд дээш/доош чирж солино. Карт багтахгүй үед
            // доторх текстийг гүйлгэх нь илүү чухал тул чирэхийг унтраана.
            drag={reduce || !fits ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              const far = Math.abs(info.offset.y) > 90;
              const fast = Math.abs(info.velocity.y) > 480;
              if (!far && !fast) return;
              go(info.offset.y < 0 ? 1 : -1);
            }}
            className="absolute inset-0"
          >
            {atEnd ? (
              <FeedEnd
                streak={streak}
                onRestart={() => {
                  setDir(-1);
                  onIndexChange(0);
                }}
              />
            ) : (
              <FeedCard
                card={cards[index]}
                onOpenQuiz={() => onOpenQuiz(cards[index])}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Дээш/доош товч — компьютерт харагдана, гараар ч хандах боломжтой */}
      <div className="flex shrink-0 items-center justify-center gap-2 pt-2.5">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={index === 0}
          aria-label="Өмнөх хууль"
          className="press grid h-11 w-11 place-items-center rounded-full border-2 border-ink-200 bg-white text-ink-700 hover:border-brand-400 hover:text-brand-700 disabled:opacity-40"
        >
          <span aria-hidden>↑</span>
        </button>
        <span className="px-1 text-center text-[12.5px] font-semibold text-ink-500">
          {fits ? "Сумны товчоор эсвэл чирж солино" : "Сумны товч эсвэл ↑↓-оор солино"}
        </span>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={atEnd}
          aria-label="Дараагийн хууль"
          className="press grid h-11 w-11 place-items-center rounded-full border-2 border-ink-200 bg-white text-ink-700 hover:border-brand-400 hover:text-brand-700 disabled:opacity-40"
        >
          <span aria-hidden>↓</span>
        </button>
      </div>
    </div>
  );
}
