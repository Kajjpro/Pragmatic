"use client";

import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { BookOpenText, CalendarCheck, Flame, RotateCcw, Sparkles } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { buttonClass } from "@/components/ui/button";
import { today, yesterdayOf } from "@/components/feed/progress-store";
import { DAILY_CARD_GOAL, POINTS, STREAK_BADGE_DAYS } from "@/lib/points-rules";
import { cn } from "@/lib/cn";
import type { Score } from "./me-context";

// Долоо хоногийн өдрүүд (Даваа → Ням)
const WEEKDAYS = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];

// Сүүлийн 7 өдөр: цувралд орсон эсэх (цуврал нь дараалсан өдрүүд тул сүүлийн өдрөөс ухарч тоолно)
export function lastSevenDays(score: Score) {
  const now = today();
  const days: { day: string; label: string; active: boolean; isToday: boolean }[] = [];
  let d = now;
  for (let i = 0; i < 7; i++) {
    days.unshift({ day: d, label: WEEKDAYS[new Date(`${d}T12:00:00Z`).getUTCDay()], active: false, isToday: d === now });
    d = yesterdayOf(d);
  }
  if (score.lastActiveDay && score.streak > 0) {
    const active = new Set<string>();
    let a = score.lastActiveDay;
    for (let i = 0; i < score.streak && i < 7; i++) {
      active.add(a);
      a = yesterdayOf(a);
    }
    for (const x of days) x.active = active.has(x.day);
  }
  return days;
}

export function StreakModal({ open, onClose, score }: { open: boolean; onClose: () => void; score: Score }) {
  const days = lastSevenDays(score);
  const activeToday = score.lastActiveDay === today();
  const goal = Math.min(score.viewedToday, DAILY_CARD_GOAL);
  const toBadge = Math.max(0, STREAK_BADGE_DAYS - score.streak);

  return (
    <Sheet open={open} onClose={onClose} title="Дараалсан өдөр">
      <div className="flex flex-col gap-5">
        {/* Том дөл ба тоо */}
        <div className="flex items-center gap-4 rounded-xl border border-gold-200 bg-gold-bg p-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-surface shadow-card">
            <Flame aria-hidden className={cn("h-9 w-9", score.streak > 0 ? "fill-gold text-gold" : "text-line-strong")} />
          </span>
          <div>
            <p className="font-serif text-[40px] font-bold leading-none tabular-nums text-heading">{score.streak}</p>
            <p className="mt-1 text-[14.5px] text-muted">өдөр дараалан хууль уншсан</p>
          </div>
        </div>

        <p className={cn("text-[15px] font-medium", activeToday ? "text-good-fg" : "text-gold-fg")}>
          {activeToday
            ? "Өнөөдрийн цуврал баталгаажлаа. Маргааш дахин уулзъя."
            : score.streak > 0
              ? "Өнөөдөр нэг карт уншаад цувралаа хадгална уу."
              : "Өнөөдөр нэг карт уншаад цувралаа эхлүүлээрэй."}
        </p>

        {/* Сүүлийн 7 өдөр */}
        <ol className="grid grid-cols-7 gap-1.5" aria-label="Сүүлийн 7 өдөр">
          {days.map((d) => (
            <li key={d.day} className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "grid h-10 w-10 place-items-center rounded-full border",
                  d.active ? "border-gold bg-gold text-white" : "border-line bg-surface text-line-strong",
                  d.isToday && !d.active && "border-dashed border-gold",
                )}
              >
                <Flame aria-hidden className={cn("h-5 w-5", d.active && "fill-white")} />
              </span>
              <span className={cn("text-[12.5px]", d.isToday ? "font-semibold text-heading" : "text-muted")}>{d.label}</span>
              <span className="sr-only">{d.active ? "уншсан" : "уншаагүй"}</span>
            </li>
          ))}
        </ol>

        {/* Өдрийн зорилго ба дараагийн тэмдэг */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line p-3.5">
            <p className="text-[13.5px] text-muted">Өнөөдрийн зорилго</p>
            <p className="mt-0.5 font-semibold tabular-nums">
              {goal} / {DAILY_CARD_GOAL} карт
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-good transition-[width]" style={{ width: `${(goal / DAILY_CARD_GOAL) * 100}%` }} />
            </div>
          </div>
          <div className="rounded-xl border border-line p-3.5">
            <p className="text-[13.5px] text-muted">«{STREAK_BADGE_DAYS} хоног тасралтгүй» тэмдэг</p>
            <p className="mt-0.5 font-semibold tabular-nums">{toBadge === 0 ? "Авсан" : `${toBadge} өдөр үлдлээ`}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-gold transition-[width]" style={{ width: `${(Math.min(score.streak, STREAK_BADGE_DAYS) / STREAK_BADGE_DAYS) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Дүрэм */}
        <ul className="flex flex-col gap-2.5 text-[14.5px]">
          <li className="flex gap-2.5">
            <BookOpenText aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
            Өдөрт дор хаяж нэг карт уншихад цуврал 1 өдрөөр нэмэгдэнэ.
          </li>
          <li className="flex gap-2.5">
            <RotateCcw aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
            Нэг өдөр алгасвал цуврал 0-ээс дахин эхэлнэ.
          </li>
          <li className="flex gap-2.5">
            <Sparkles aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
            Карт бүрийг өдөрт анх үзэхэд +{POINTS.CARD_VIEW}, асуултад анхны оролдлогоор зөв хариулбал +{POINTS.QUIZ_CORRECT} оноо.
          </li>
          <li className="flex gap-2.5">
            <CalendarCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
            {STREAK_BADGE_DAYS} өдөр дараалбал «{STREAK_BADGE_DAYS} хоног тасралтгүй» тэмдэг авна.
          </li>
        </ul>

        {!score.signedIn ? (
          <p className="rounded-lg bg-surface-2 px-3.5 py-2.5 text-[14px] text-muted">
            Нэвтрээгүй тул таны явц зөвхөн энэ төхөөрөмж дээр хадгалагдаж байна.{" "}
            <SignInButton mode="modal">
              <button type="button" className="font-semibold text-fg underline underline-offset-2">
                Нэвтэрч хадгалах
              </button>
            </SignInButton>
          </p>
        ) : null}

        <Link href="/feed" onClick={onClose} className={buttonClass("primary", "md", "w-full")}>
          Өнөөдрийн хууль унших
        </Link>
      </div>
    </Sheet>
  );
}
