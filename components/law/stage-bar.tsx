import { cn } from "@/lib/cn";
import type { Stage } from "@/lib/mock";
import { stageLabels } from "@/lib/mock";

const order: Stage[] = [
  "DISCUSS_DECISION",
  "FIRST_READING",
  "FINAL_READING",
  "FINAL_APPROVAL",
];

export function StageBar({
  current,
  size = "md",
}: {
  current: Stage;
  size?: "sm" | "md";
}) {
  const activeIdx = order.indexOf(current);
  const commentPhase = current === "FIRST_READING" || current === "FINAL_READING";
  return (
    <div className="flex w-full flex-col gap-1">
      <ol className="flex w-full items-center gap-2">
        {order.map((s, i) => {
          const state =
            i < activeIdx ? "done" : i === activeIdx ? "active" : "todo";
          return (
            <li key={s} className="flex flex-1 items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "grid place-items-center rounded-full font-bold ring-2 transition-all",
                    size === "sm"
                      ? "h-5 w-5 text-[9px] ring-1"
                      : "h-7 w-7 text-[11px]",
                    state === "done" &&
                      "bg-parliament-700 text-white ring-parliament-100",
                    state === "active" &&
                      "bg-gold-400 text-parliament-950 ring-gold-100 shadow-[0_0_0_5px_rgba(255,198,7,0.18)]",
                    state === "todo" && "bg-white text-ink-500 ring-ink-100",
                  )}
                >
                  {i + 1}
                </span>
                <span
                  className={cn(
                    "whitespace-nowrap font-semibold",
                    size === "sm" ? "text-[9.5px]" : "text-[11px]",
                    state === "done" && "text-parliament-700",
                    state === "active" && "text-parliament-900",
                    state === "todo" && "text-ink-500",
                  )}
                >
                  {stageLabels[s]}
                </span>
              </div>
              {i < order.length - 1 ? (
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
      {commentPhase && size === "md" ? (
        <div className="mt-1 inline-flex w-fit items-center gap-1.5 self-start rounded-full bg-gold-100 px-2.5 py-0.5 text-[10.5px] font-semibold text-gold-500">
          <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
          Санал өгөх үе
        </div>
      ) : null}
    </div>
  );
}
