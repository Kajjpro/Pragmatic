import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { stageLabels, stageOrder } from "@/lib/labels";
import type { Stage } from "@/lib/law/types";

// Хуулийн төслийн 4 шат: Хэлэлцэх эсэх → Анхны → Эцсийн → Эцэслэн батлах
export function StageBar({ current }: { current: Stage }) {
  const activeIdx = stageOrder.indexOf(current);
  return (
    <ol aria-label="Хэлэлцүүлгийн шат" className="grid grid-cols-4 gap-2">
      {stageOrder.map((s, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <li key={s} aria-current={active ? "step" : undefined} className="flex flex-col gap-1.5">
            <span className={cn("h-1 rounded-full", done || active ? "bg-primary" : "bg-line")} />
            <span
              className={cn(
                "items-center gap-1 text-[13px] leading-tight",
                // Гар утсанд зөвхөн одоогийн шатны нэр (бусад нь зураасаар)
                active ? "flex font-semibold text-heading" : done ? "hidden text-fg sm:flex" : "hidden text-muted sm:flex",
              )}
            >
              {done ? <Check aria-hidden className="h-3.5 w-3.5 shrink-0" /> : null}
              {stageLabels[s]}
              {active ? <span className="sr-only"> (одоогийн шат)</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
