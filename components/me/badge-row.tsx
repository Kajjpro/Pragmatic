"use client";

import { BADGE_TYPES, badgeLabels, type Badge, type BadgeType } from "@/lib/types";
import { cn } from "@/lib/cn";

// Хэрхэн авах вэ — аваагүй тэмдэг дээр тайлбар болгон харуулна
const howTo: Record<BadgeType, string> = {
  LAW_CHANGER: "Заалт дээр санал бич — хуульд тусгагдвал",
  STREAK_7: "7 хоног дараалан карт үз",
  FIRST_PREDICTION: "Эхний таамгаа өг",
};

export function BadgeRow({
  badges,
  onOpen,
}: {
  badges: Badge[];
  onOpen?: (badge: Badge) => void;
}) {
  const earned = new Map(badges.map((b) => [b.type, b]));

  return (
    <ul className="flex flex-wrap gap-2.5">
      {BADGE_TYPES.map((type) => {
        const badge = earned.get(type);
        const label = badgeLabels[type];
        const has = Boolean(badge);

        const inner = (
          <>
            <span
              className={cn("text-[26px]", !has && "grayscale")}
              aria-hidden
            >
              {has ? label.emoji : "🔒"}
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  "block text-[14px] font-extrabold leading-tight",
                  has ? "text-ink-950" : "text-ink-600",
                )}
              >
                {label.title}
              </span>
              <span className="mt-0.5 block text-[12.5px] leading-tight text-ink-600">
                {has ? "Авсан" : howTo[type]}
              </span>
            </span>
          </>
        );

        return (
          <li key={type}>
            {has && onOpen ? (
              <button
                type="button"
                onClick={() => onOpen(badge!)}
                className="press flex min-h-16 items-center gap-2.5 rounded-2xl border-2 border-point-300 bg-point-100 px-3.5 text-left hover:border-point-400"
              >
                {inner}
              </button>
            ) : (
              <div
                className={cn(
                  "flex min-h-16 items-center gap-2.5 rounded-2xl border-2 px-3.5",
                  has
                    ? "border-point-300 bg-point-100"
                    : "border-dashed border-ink-200 bg-ink-50",
                )}
              >
                {inner}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
