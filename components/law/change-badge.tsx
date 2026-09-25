import { cn } from "@/lib/cn";
import { changeTypeLabels } from "@/lib/labels";
import type { ChangeType } from "@/lib/law/types";

// Заалт нэмэгдсэн / хасагдсан / өөрчлөгдсөн эсэхийг өнгөөр харуулна.
const styles: Record<ChangeType, string> = {
  ADDED: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  REMOVED: "bg-rose-100 text-rose-800 ring-rose-200",
  CHANGED: "bg-point-100 text-point-700 ring-point-300",
  UNCHANGED: "bg-ink-100 text-ink-700 ring-ink-300",
};

export function ChangeBadge({ type }: { type: ChangeType }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold uppercase tracking-[0.05em] ring-1 ring-inset",
        styles[type],
      )}
    >
      {changeTypeLabels[type]}
    </span>
  );
}
