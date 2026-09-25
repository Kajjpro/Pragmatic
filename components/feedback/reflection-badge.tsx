import { cn } from "@/lib/cn";
import { reflectionLabels } from "@/lib/labels";
import type { ReflectionValue } from "@/lib/law/queries";

// Иргэний санал тусгагдсан эсэх: ✅ Тусгасан / ❌ Тусгаагүй / ⏳ Хүлээгдэж буй.
const styles: Record<ReflectionValue, { icon: string; className: string }> = {
  REFLECTED: {
    icon: "✅",
    className: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  },
  NOT_REFLECTED: {
    icon: "❌",
    className: "bg-rose-100 text-rose-800 ring-rose-200",
  },
  PENDING: {
    icon: "⏳",
    className: "bg-point-100 text-point-700 ring-point-300",
  },
};

export function ReflectionBadge({
  value,
  className,
}: {
  value: ReflectionValue;
  className?: string;
}) {
  const s = styles[value];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-bold ring-1 ring-inset",
        s.className,
        className,
      )}
    >
      <span className="text-[11px]">{s.icon}</span>
      {reflectionLabels[value]}
    </span>
  );
}
