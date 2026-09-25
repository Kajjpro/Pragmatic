import { Check, FileText, MessagesSquare, Landmark, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatShortDate } from "@/lib/format";
import type { MyComment } from "@/lib/types";

// Саналын 3 шат: Илгээсэн → Хэлэлцэж байна → Тусгагдсан.
// Шат нь бодит төлөвөөс: бүлэгт орсон бол хэлэлцэж байна, ажлын алба хариулсан бол эцсийн шат.
export type ImpactStage = { step: 1 | 2 | 3; outcome: "REFLECTED" | "NOT_REFLECTED" | null };

export function impactStage(c: MyComment): ImpactStage {
  if (c.group?.repliedAt) return { step: 3, outcome: c.group.reflection === "REFLECTED" ? "REFLECTED" : "NOT_REFLECTED" };
  if (c.group) return { step: 2, outcome: null };
  return { step: 1, outcome: null };
}

export function ImpactStepper({ comment }: { comment: MyComment }) {
  const { step, outcome } = impactStage(comment);
  const final =
    outcome === "NOT_REFLECTED"
      ? { label: "Тусгаагүй", Icon: X }
      : { label: "Тусгагдсан", Icon: Landmark };

  const steps = [
    { label: "Илгээсэн", Icon: FileText, date: comment.createdAt },
    { label: "Хэлэлцэж байна", Icon: MessagesSquare, date: null },
    { label: final.label, Icon: final.Icon, date: comment.group?.repliedAt ?? null },
  ];

  return (
    <ol className="grid grid-cols-3" aria-label="Саналын явц">
      {steps.map((s, i) => {
        const n = i + 1;
        const done = n < step || (n === step && (n !== 3 || outcome !== null));
        const current = n === step && !done;
        const isFinal = n === 3 && done;
        const Icon = done && !isFinal ? Check : s.Icon;
        return (
          <li key={s.label} className="relative flex flex-col items-center text-center">
            {/* Холбох зураас */}
            {i > 0 ? (
              <span
                aria-hidden
                className={cn("absolute right-1/2 top-[18px] h-0.5 w-full", n <= step ? "bg-primary" : "bg-line")}
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 grid h-9 w-9 place-items-center rounded-full border-2",
                isFinal && outcome === "REFLECTED"
                  ? "border-good bg-good text-white"
                  : isFinal
                    ? "border-line-strong bg-surface-2 text-muted"
                    : done
                      ? "border-primary bg-primary text-on-primary"
                      : current
                        ? "border-gold bg-gold-bg text-gold-fg"
                        : "border-line bg-surface text-line-strong",
              )}
            >
              <Icon aria-hidden className="h-4 w-4" />
            </span>
            <span
              className={cn(
                "mt-2 text-[13px] font-semibold leading-tight",
                isFinal && outcome === "REFLECTED" ? "text-good-fg" : done || current ? "text-heading" : "text-muted",
              )}
            >
              {s.label}
              <span className="sr-only">{done ? " — болсон" : current ? " — одоо энэ шатанд" : " — хүлээгдэж буй"}</span>
            </span>
            {s.date && (done || current) ? (
              <span className="mt-0.5 text-[12px] tabular-nums text-muted">{formatShortDate(new Date(s.date))}</span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
