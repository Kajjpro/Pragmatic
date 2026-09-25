import { cn } from "@/lib/cn";

export function ScoreCompare({
  ownerScore,
  auditorScore,
  size = "md",
}: {
  ownerScore: number;
  auditorScore: number;
  size?: "sm" | "md";
}) {
  const diff = ownerScore - auditorScore;
  const highlight = Math.abs(diff) >= 15;
  const barH = size === "sm" ? "h-1.5" : "h-2";
  return (
    <div className={cn("min-w-[160px]", size === "sm" && "min-w-[130px]")}>
      <div className="grid grid-cols-[42px_1fr_28px] items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
          Өөрийн
        </span>
        <div className={cn("relative overflow-hidden rounded-full bg-ink-100", barH)}>
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-parliament-600 transition-[width] duration-500"
            style={{ width: `${Math.max(0, Math.min(100, ownerScore))}%` }}
          />
        </div>
        <span className="text-right text-[11px] font-semibold tabular-nums text-parliament-800">
          {ownerScore}
        </span>
      </div>
      <div className="mt-1 grid grid-cols-[42px_1fr_28px] items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
          Дээд
        </span>
        <div className={cn("relative overflow-hidden rounded-full bg-ink-100", barH)}>
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-[width] duration-500",
              highlight ? "bg-rose-500" : "bg-emerald-500",
            )}
            style={{ width: `${Math.max(0, Math.min(100, auditorScore))}%` }}
          />
        </div>
        <span
          className={cn(
            "text-right text-[11px] font-semibold tabular-nums",
            highlight ? "text-rose-700" : "text-emerald-700",
          )}
        >
          {auditorScore}
        </span>
      </div>
      {highlight ? (
        <div className="mt-1 text-[10px] font-medium text-rose-700">
          Зөрүү {Math.abs(diff)} нэгж
        </div>
      ) : null}
    </div>
  );
}
