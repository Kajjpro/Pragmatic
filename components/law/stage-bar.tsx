import { cn } from "@/lib/cn";
import { commentStages, stageLabels, stageOrder } from "@/lib/labels";
import type { Stage } from "@/lib/law/types";

const order = stageOrder;

// Хуулийн төслийн 4 үе шат. tone="dark" бол бараан хөх дэвсгэр дээр харагдана.
export function StageBar({
  current,
  size = "md",
  tone = "light",
}: {
  current: Stage;
  size?: "sm" | "md";
  tone?: "light" | "dark";
}) {
  const activeIdx = order.indexOf(current);
  const commentPhase = commentStages.includes(current);
  const dark = tone === "dark";

  return (
    <div className="flex w-full flex-col gap-1">
      <ol className="flex w-full items-start gap-1.5 sm:gap-2">
        {order.map((s, i) => {
          const state =
            i < activeIdx ? "done" : i === activeIdx ? "active" : "todo";
          return (
            <li key={s} className="flex flex-1 items-start gap-1.5 sm:gap-2">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <span
                  className={cn(
                    "grid shrink-0 place-items-center rounded-full font-bold ring-2 transition-all",
                    size === "sm" ? "h-6 w-6 text-[11px]" : "h-8 w-8 text-[13px]",
                    // Дууссан үе шат
                    state === "done" &&
                      (dark
                        ? "bg-white/90 text-ink-950 ring-white/30"
                        : "bg-brand-700 text-white ring-brand-200"),
                    // Одоогийн үе шат — алтаар онцлоно
                    state === "active" &&
                      "bg-point-400 text-ink-950 ring-point-300 shadow-[0_0_0_5px_rgba(255,198,7,0.22)]",
                    // Ирээдүйн үе шат
                    state === "todo" &&
                      (dark
                        ? "bg-white/10 text-white/70 ring-white/20"
                        : "bg-white text-ink-600 ring-ink-200"),
                  )}
                >
                  {i + 1}
                </span>
                <span
                  className={cn(
                    "text-center font-semibold leading-tight",
                    size === "sm" ? "text-[11px]" : "text-[13px]",
                    dark
                      ? state === "todo"
                        ? "text-white/70"
                        : "text-white"
                      : state === "done"
                        ? "text-brand-700"
                        : state === "active"
                          ? "text-ink-950"
                          : "text-ink-600",
                  )}
                >
                  {stageLabels[s]}
                </span>
              </div>
              {i < order.length - 1 ? (
                <div
                  className={cn(
                    "mt-3 h-0.5 w-3 shrink-0 rounded-full sm:w-5",
                    i < activeIdx
                      ? dark
                        ? "bg-white/70"
                        : "bg-brand-700"
                      : dark
                        ? "bg-white/20"
                        : "bg-ink-200",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      {commentPhase ? (
        <div
          className={cn(
            "mt-2 inline-flex w-fit items-center gap-1.5 self-start rounded-full px-3 py-1 text-[12.5px] font-bold",
            // point-600 текст нь point-100 дээр 2.23:1 байсан тул point-700 болгов (4.53:1)
            dark
              ? "bg-point-400 text-ink-950"
              : "bg-point-100 text-point-700 ring-1 ring-inset ring-point-300",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              dark ? "bg-ink-950" : "bg-point-700",
            )}
          />
          Санал өгөх үе
        </div>
      ) : null}
    </div>
  );
}
