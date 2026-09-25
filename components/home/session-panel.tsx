import { cn } from "@/lib/cn";
import { hallCounts, today } from "@/lib/stub/context";

const votes = [
  { label: "Дэмжсэн", value: 92, color: "bg-parliament-700" },
  { label: "Татгалзсан", value: 18, color: "bg-parliament-400" },
  { label: "Түдгэлзсэн", value: 10, color: "bg-gold-400" },
];

export function SessionPanel() {
  const max = Math.max(...votes.map((v) => v.value));
  const total = votes.reduce((a, v) => a + v.value, 0);

  return (
    <aside className="flex h-full flex-col gap-4">
      {/* Live session status */}
      <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-[0_20px_45px_-30px_rgba(15,42,99,0.35)] animate-rise">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </span>
            <h3 className="text-[12.5px] font-semibold text-parliament-900">
              Чуулган амьдаар
            </h3>
          </div>
          <span className="text-[10.5px] font-medium text-ink-500">{today}</span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-editorial text-3xl font-medium text-parliament-700">
            {total}
          </span>
          <span className="text-[11.5px] text-ink-500">
            / {hallCounts.members} гишүүн ирц бүрдсэн
          </span>
        </div>
        <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-parliament-700 py-2 text-[11.5px] font-semibold text-white transition hover:bg-parliament-800">
          Онлайн үзэх
          <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
            <path
              d="m8 5 5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Latest vote result */}
      <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-[0_20px_45px_-30px_rgba(15,42,99,0.35)] animate-rise">
        <h3 className="text-[12.5px] font-semibold text-parliament-900">
          Сүүлийн санал хураалт
        </h3>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-500">
          Төсвийн тухай хуулийн нэмэлт өөрчлөлт
        </p>

        <div className="mt-4 flex items-end justify-around gap-3 border-b border-dashed border-ink-100 pb-2">
          {votes.map((v) => {
            const h = Math.max(18, (v.value / max) * 88);
            return (
              <div key={v.label} className="flex w-full flex-col items-center gap-1">
                <span className="text-[10.5px] font-semibold text-ink-700">
                  {v.value}
                </span>
                <div
                  className={cn(
                    "w-full max-w-[42px] rounded-t-md transition-[height] duration-500 ease-out",
                    v.color,
                  )}
                  style={{ height: `${h}px` }}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex items-center justify-around text-[10px] font-medium text-ink-500">
          {votes.map((v) => (
            <span key={v.label} className="truncate">
              {v.label}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
