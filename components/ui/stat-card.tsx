import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "warn" | "danger" | "good";
  icon?: ReactNode;
}) {
  const toneClasses = {
    neutral: "border-ink-100 text-ink-900",
    warn: "border-amber-200 text-amber-900",
    danger: "border-rose-200 text-rose-900",
    good: "border-emerald-200 text-emerald-900",
  }[tone];
  const dotClasses = {
    neutral: "bg-parliament-500",
    warn: "bg-amber-500",
    danger: "bg-rose-500",
    good: "bg-emerald-500",
  }[tone];
  return (
    <div
      className={cn(
        "group flex flex-col rounded-2xl border bg-white p-5 shadow-[0_20px_45px_-30px_rgba(15,42,99,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_25px_55px_-30px_rgba(15,42,99,0.45)] animate-rise",
        toneClasses,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
          <span className={cn("h-1.5 w-1.5 rounded-full", dotClasses)} />
          {label}
        </div>
        {icon ? <span className="text-ink-500">{icon}</span> : null}
      </div>
      <div className="mt-3 text-3xl font-bold tabular-nums">{value}</div>
      {hint ? (
        <div className="mt-1 text-[12px] text-ink-500">{hint}</div>
      ) : null}
    </div>
  );
}
