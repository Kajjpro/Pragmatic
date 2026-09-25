import type { ReactNode } from "react";

// Өгөгдөл байхгүй үеийн төлөв.
export function EmptyState({
  emoji = "📭",
  title,
  description,
  action,
}: {
  emoji?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-ink-200 bg-ink-50 px-6 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-2xl shadow-soft">
        <span aria-hidden>{emoji}</span>
      </div>
      <h3 className="mt-4 text-[18px] font-bold text-ink-900">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-ink-600">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
