import { cn } from "@/lib/cn";
import type { ChangeType } from "@/lib/mock";

const cfg: Record<ChangeType, { label: string; className: string }> = {
  ADDED: {
    label: "Нэмсэн",
    className: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  },
  REMOVED: {
    label: "Хассан",
    className: "bg-rose-100 text-rose-800 ring-rose-200",
  },
  CHANGED: {
    label: "Өөрчилсөн",
    className: "bg-gold-100 text-gold-500 ring-gold-300",
  },
  UNCHANGED: {
    label: "Өөрчлөөгүй",
    className: "bg-ink-100 text-ink-700 ring-ink-200",
  },
};

export function ChangeBadge({ type }: { type: ChangeType }) {
  const c = cfg[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] ring-1 ring-inset",
        c.className,
      )}
    >
      {c.label}
    </span>
  );
}
