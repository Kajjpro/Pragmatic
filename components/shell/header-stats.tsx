"use client";

import { useEffect, useRef, useState } from "react";
import { Award, Flame } from "lucide-react";
import { cn } from "@/lib/cn";
import { useScore } from "./me-context";
import { StreakModal } from "./streak-modal";
import type { SourceState } from "@/lib/status";

// ── УИХ-ын API-ийн бодит холболт (GET /api/status, 5 минутын кэштэй) ──
const statusText: Record<SourceState | "loading", string> = {
  loading: "УИХ API шалгаж байна",
  online: "УИХ API холбогдсон",
  offline: "УИХ API түр холбогдохгүй",
  unconfigured: "УИХ API тохируулаагүй",
};

export function ApiStatusPill({ className }: { className?: string }) {
  const [state, setState] = useState<SourceState | "loading">("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((s: { parliament?: SourceState } | null) => {
        if (!cancelled) setState(s?.parliament ?? "offline");
      })
      .catch(() => {
        if (!cancelled) setState("offline");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <span
      className={cn("inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[13px] font-medium text-muted", className)}
      role="status"
    >
      <span className="relative flex h-2 w-2">
        {state === "online" ? <span className="absolute inset-0 animate-ping rounded-full bg-good opacity-60 motion-reduce:hidden" /> : null}
        <span
          className={cn(
            "relative h-2 w-2 rounded-full",
            state === "online" ? "bg-good" : state === "offline" ? "bg-gold" : "bg-line-strong",
          )}
        />
      </span>
      {statusText[state]}
    </span>
  );
}

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
