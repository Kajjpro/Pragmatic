"use client";

import { useState } from "react";
import { Flame, Info } from "lucide-react";
import { useScore } from "@/components/shell/me-context";
import { StreakModal, lastSevenDays } from "@/components/shell/streak-modal";
import { DAILY_CARD_GOAL } from "@/lib/points-rules";
import { cn } from "@/lib/cn";

// /feed-ийн хажуугийн самбар: дараалсан өдөр, 7 хоног, өдрийн зорилго. Дарахад дэлгэрэнгүй цонх.
export function StreakPanel() {
  const score = useScore();
  const [open, setOpen] = useState(false);
  const days = lastSevenDays(score);
  const goal = Math.min(score.viewedToday, DAILY_CARD_GOAL);

  return (
    <section aria-labelledby="streak-title" className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold-bg">
          <Flame aria-hidden className={cn("h-7 w-7", score.streak > 0 ? "fill-gold text-gold" : "text-line-strong")} />
        </span>
        <div>
          <h2 id="streak-title" className="font-sans text-[13.5px] font-medium text-muted">
            Дараалсан өдөр
          </h2>
          <p className="font-serif text-[30px] font-bold leading-none tabular-nums text-heading">
            {score.streak} <span className="font-sans text-[15px] font-medium text-muted">өдөр</span>
          </p>
        </div>
      </div>

      <ol className="mt-4 grid grid-cols-7 gap-1" aria-label="Сүүлийн 7 өдөр">
        {days.map((d) => (
          <li key={d.day} className="flex flex-col items-center gap-1">
            <span
              className={cn(
                "grid h-7 w-7 place-items-center rounded-full",
                d.active ? "bg-gold text-white" : "bg-surface-2 text-line-strong",
                d.isToday && !d.active && "border border-dashed border-gold",
              )}
            >
              <Flame aria-hidden className={cn("h-3.5 w-3.5", d.active && "fill-white")} />
            </span>
            <span className={cn("text-[11.5px]", d.isToday ? "font-semibold text-heading" : "text-muted")}>{d.label}</span>
          </li>
        ))}
      </ol>

      <div className="mt-4">
        <div className="flex justify-between text-[13.5px]">
          <span className="text-muted">Өнөөдрийн зорилго</span>
          <span className="font-semibold tabular-nums">
            {goal} / {DAILY_CARD_GOAL} карт
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-good transition-[width] duration-500" style={{ width: `${(goal / DAILY_CARD_GOAL) * 100}%` }} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-line py-2 text-[13.5px] font-semibold text-fg hover:border-line-strong hover:bg-surface-2"
      >
        <Info aria-hidden className="h-4 w-4" /> Цуврал хэрхэн ажилладаг вэ?
      </button>

      <StreakModal open={open} onClose={() => setOpen(false)} score={score} />
    </section>
  );
}
