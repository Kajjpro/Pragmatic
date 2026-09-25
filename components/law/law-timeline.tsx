import { cn } from "@/lib/cn";
import type { Law } from "@/lib/stub/types";

const stages: Array<{ key: Law["stage"]; label: string }> = [
  { key: "draft", label: "Төсөл" },
  { key: "debate", label: "Хэлэлцүүлэг" },
  { key: "passed", label: "Батлагдсан" },
  { key: "implementation", label: "Хэрэгжилт" },
];

export function LawTimeline({ current }: { current: Law["stage"] }) {
  const activeIdx = stages.findIndex((s) => s.key === current);
  return (
    <ol className="flex w-full items-center gap-2">
      {stages.map((s, i) => {
        const state =
          i < activeIdx ? "done" : i === activeIdx ? "active" : "todo";
        return (
          <li key={s.key} className="flex flex-1 items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold ring-2 transition-all",
                  state === "done" &&
                    "bg-parliament-800 text-white ring-parliament-200",
                  state === "active" &&
                    "bg-gold-400 text-parliament-950 ring-gold-200 shadow-[0_0_0_6px_rgba(244,197,66,0.15)]",
                  state === "todo" && "bg-white text-ink-500 ring-ink-100",
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap text-[11px] font-semibold",
                  state === "done" && "text-parliament-800",
                  state === "active" && "text-parliament-900",
                  state === "todo" && "text-ink-500",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < stages.length - 1 ? (
              <div
                className={cn(
                  "-mt-4 h-0.5 flex-1 rounded-full",
                  i < activeIdx ? "bg-parliament-700" : "bg-ink-100",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
