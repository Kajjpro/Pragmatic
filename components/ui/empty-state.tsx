import type { ReactNode } from "react";
import { Inbox, type LucideIcon } from "lucide-react";

// Өгөгдөл байхгүй үеийн төлөв: яагаад хоосон байгааг ба дараагийн алхмыг хэлнэ.
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-line-strong bg-surface px-6 py-10 text-center">
      <Icon aria-hidden className="h-8 w-8 text-muted" strokeWidth={1.5} />
      <h3 className="mt-3 text-[18px] font-bold">{title}</h3>
      {description ? <p className="mt-1.5 max-w-md text-[15px] text-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
