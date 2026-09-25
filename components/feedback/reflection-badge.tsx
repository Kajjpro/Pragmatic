import { cn } from "@/lib/cn";
import type { Reflection } from "@/lib/mock";

const cfg: Record<Reflection, { label: string; className: string; icon: string }> = {
  REFLECTED: {
    label: "Тусгасан",
    icon: "✅",
    className: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  },
  NOT_REFLECTED: {
    label: "Тусгаагүй",
    icon: "❌",
    className: "bg-rose-100 text-rose-800 ring-rose-200",
  },
  PENDING: {
    label: "Хүлээгдэж буй",
    icon: "⏳",
    className: "bg-gold-100 text-gold-500 ring-gold-300",
  },
};

export function ReflectionBadge({
  value,
  className,
}: {
  value: Reflection;
  className?: string;
}) {
  const c = cfg[value];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        c.className,
        className,
      )}
    >
      <span className="text-[10px]">{c.icon}</span>
      {c.label}
    </span>
  );
}
