import { cn } from "@/lib/cn";

export function VoteResultBar({
  support,
  oppose,
  neutral,
  total,
  compact = false,
}: {
  support: number;
  oppose: number;
  neutral: number;
  total: number;
  compact?: boolean;
}) {
  const s = (v: number) => (total ? (v / total) * 100 : 0);
  return (
    <div className="w-full">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className="bg-emerald-500 transition-[width] duration-500"
          style={{ width: `${s(support)}%` }}
          title={`Дэмжсэн ${support}`}
        />
        <div
          className="bg-rose-500 transition-[width] duration-500"
          style={{ width: `${s(oppose)}%` }}
          title={`Татгалзсан ${oppose}`}
        />
        <div
          className="bg-ink-300 transition-[width] duration-500"
          style={{ width: `${s(neutral)}%` }}
          title={`Түдгэлзсэн ${neutral}`}
        />
      </div>
      <div
        className={cn(
          "mt-2 flex items-center gap-4 text-[12px]",
          compact && "text-[11px]",
        )}
      >
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Дэмжсэн <b className="tabular-nums">{support.toLocaleString("mn-MN")}</b>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          Татгалзсан <b className="tabular-nums">{oppose.toLocaleString("mn-MN")}</b>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-ink-300" />
          Түдгэлзсэн <b className="tabular-nums">{neutral.toLocaleString("mn-MN")}</b>
        </span>
      </div>
    </div>
  );
}
