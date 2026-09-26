"use client";

import { useEffect, useRef, useState } from "react";
import { Award, Flame } from "lucide-react";
import { cn } from "@/lib/cn";
import { useScore } from "./me-context";
import { StreakModal } from "./streak-modal";

// ── Дараалсан өдөр (дарахад цонх нээгдэнэ) ──
export function StreakButton({ className, label = false }: { className?: string; label?: boolean }) {
  const score = useScore();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Дараалсан өдөр: ${score.streak}. Дэлгэрэнгүй`}
        className={cn(
          "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[14px] font-semibold tabular-nums transition-colors",
          score.streak > 0 ? "border-gold-200 bg-gold-bg text-gold-fg hover:border-gold" : "border-line bg-surface text-muted hover:border-line-strong",
          className,
        )}
      >
        <Flame aria-hidden className={cn("h-4 w-4", score.streak > 0 && "fill-gold text-gold")} />
        {score.streak}
        {label ? <span className="font-medium">өдөр</span> : null}
      </button>
      <StreakModal open={open} onClose={() => setOpen(false)} score={score} />
    </>
  );
}

// ── Нөлөөний оноо: нэмэгдэхэд "+N" гэж товч харуулна ──
export function PointsBadge({ className }: { className?: string }) {
  const { points } = useScore();
  const prev = useRef<number | null>(null);
  const [gain, setGain] = useState<{ n: number; key: number } | null>(null);

  useEffect(() => {
    const before = prev.current;
    prev.current = points;
    if (before === null || points <= before) return;
    const next = { n: points - before, key: Date.now() };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- онооны өөрчлөлтөд хариу үзүүлэх товч мэдэгдэл
    setGain(next);
    const t = setTimeout(() => setGain((g) => (g?.key === next.key ? null : g)), 1600);
    return () => clearTimeout(t);
  }, [points]);

  return (
    <span
      className={cn("relative inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[14px] font-semibold tabular-nums text-fg", className)}
      aria-label={`Нөлөөний оноо: ${points}`}
    >
      <Award aria-hidden className="h-4 w-4 text-good" />
      {points.toLocaleString("mn-MN")}
      <span className="hidden font-medium text-muted sm:inline">оноо</span>
      {gain ? (
        <span key={gain.key} aria-hidden className="absolute -top-3 right-1 animate-pop rounded-full bg-good px-1.5 text-[12px] font-bold text-white">
          +{gain.n}
        </span>
      ) : null}
    </span>
  );
}
