import { cn } from "@/lib/cn";
import { hallCounts, today } from "@/lib/stub/context";

const members = [
  { hall: "1", name: "Ц.Цэрэн-Отгон", faction: "МАН" },
  { hall: "2", name: "Б.Батжаргал", faction: "МАН" },
  { hall: "3", name: "Х.Хишигдэлгэр", faction: "АН" },
  { hall: "4", name: "Д.Долгорсүрэн", faction: "МАН" },
  { hall: "5", name: "Э.Энхтуяа", faction: "ХҮН" },
  { hall: "6", name: "О.Оюунтуяа", faction: "АН" },
  { hall: "7", name: "Т.Түмэнжаргал", faction: "МАН" },
  { hall: "8", name: "Ч.Чинбат", faction: "МАН" },
  { hall: "9", name: "Ж.Жаргалсайхан", faction: "ХҮН" },
  { hall: "10", name: "С.Сарангэрэл", faction: "АН" },
  { hall: "11", name: "Н.Нямбаяр", faction: "МАН" },
  { hall: "12", name: "Б.Баярсайхан", faction: "МАН" },
  { hall: "13", name: "Г.Ганбаатар", faction: "АН" },
  { hall: "14", name: "Р.Рэнцэндорж", faction: "МАН" },
];

const votes = [
  { label: "Дэмжсэн", value: 92, color: "bg-parliament-700" },
  { label: "Татгалзсан", value: 18, color: "bg-parliament-400/70" },
  { label: "Түдгэлзсэн", value: 10, color: "bg-parliament-300/70" },
];

const factionColor: Record<string, string> = {
  МАН: "bg-parliament-700",
  АН: "bg-parliament-400",
  ХҮН: "bg-gold-400",
};

export function SessionPanel() {
  const max = Math.max(...votes.map((v) => v.value));
  return (
    <aside className="flex h-full flex-col gap-4">
      <div className="flex-1 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-[0_20px_45px_-30px_rgba(15,42,99,0.4)] animate-rise">
        <header className="flex items-center justify-between border-b border-ink-100 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-parliament-50 text-parliament-800">
              <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
                <path
                  d="M4 6h12M4 10h12M4 14h8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <h3 className="text-[12px] font-semibold text-parliament-900">
              Чуулганы танхим
            </h3>
          </div>
          <span className="text-[10.5px] font-medium text-ink-500">
            {hallCounts.members} гишүүн
          </span>
        </header>

        <ul className="scroll-slim max-h-[360px] overflow-y-auto">
          {members.map((m) => (
            <li
              key={m.hall}
              className="group flex items-center gap-3 border-b border-ink-100/70 px-4 py-1.5 text-[12px] text-ink-700 transition hover:bg-parliament-50/60"
            >
              <span className="w-6 text-right font-mono text-[11px] text-ink-500">
                {m.hall}
              </span>
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  factionColor[m.faction] ?? "bg-ink-300",
                )}
                aria-hidden
              />
              <span className="flex-1 truncate font-medium text-ink-900 group-hover:text-parliament-900">
                {m.name}
              </span>
              <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[9.5px] font-semibold tracking-wide text-ink-700">
                {m.faction}
              </span>
            </li>
          ))}
        </ul>

        <button className="flex w-full items-center justify-center gap-1.5 border-t border-ink-100 bg-parliament-50/60 py-2 text-[11.5px] font-semibold text-parliament-800 transition hover:bg-parliament-100">
          Бүрэн жагсаалт үзэх
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

      <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-[0_20px_45px_-30px_rgba(15,42,99,0.4)] animate-rise">
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] font-semibold text-parliament-900">
            Сүүлийн санал хураалт
          </h3>
          <span className="text-[10.5px] font-medium text-ink-500">
            {today}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-500">
          Төсвийн тухай хуулийн нэмэлт өөрчлөлт
        </p>

        <div className="mt-3 flex items-end justify-around gap-3 border-b border-dashed border-ink-100 pb-2">
          {votes.map((v) => {
            const h = Math.max(18, (v.value / max) * 88);
            return (
              <div
                key={v.label}
                className="flex w-full flex-col items-center gap-1"
              >
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

        <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-parliament-800 py-2 text-[11.5px] font-semibold text-white transition hover:bg-parliament-700">
          <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
            <path
              d="M10 3v14M3 10h14"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          УИХ-д таны сонсох байна
        </button>
      </div>
    </aside>
  );
}
