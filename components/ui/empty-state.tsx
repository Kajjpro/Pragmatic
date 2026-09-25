import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-100 bg-parliament-50/40 px-8 py-12 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-full bg-white text-parliament-700 shadow-sm ring-1 ring-ink-100">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M5 7h14M5 12h14M5 17h9"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h4 className="mt-3 text-sm font-semibold text-ink-900">{title}</h4>
      {description ? (
        <p className="mt-1 max-w-sm text-[12.5px] text-ink-500">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
