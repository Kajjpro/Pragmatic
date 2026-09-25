import { cn } from "@/lib/cn";
import type { FlagLevel } from "@/lib/stub/types";

const config: Record<FlagLevel, { label: string; className: string }> = {
  HIGH: {
    label: "ӨНДӨР",
    className: "bg-rose-100 text-rose-800 ring-rose-200",
  },
  MEDIUM: {
    label: "ДУНД",
    className: "bg-amber-100 text-amber-800 ring-amber-200",
  },
  LOW: {
    label: "БАГА",
    className: "bg-ink-100 text-ink-700 ring-ink-200",
  },
  OK: {
    label: "ЗӨВ",
    className: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  },
};

export function FlagBadge({
  level,
  className,
}: {
  level: FlagLevel;
  className?: string;
}) {
  const c = config[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ring-1 ring-inset",
        c.className,
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          level === "HIGH" && "bg-rose-500",
          level === "MEDIUM" && "bg-amber-500",
          level === "LOW" && "bg-ink-400",
          level === "OK" && "bg-emerald-500",
        )}
      />
      {c.label}
    </span>
  );
}
