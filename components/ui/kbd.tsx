import { cn } from "@/lib/cn";

export function Kbd({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <kbd
      className={cn(
        "inline-flex min-w-[22px] items-center justify-center rounded-md border border-ink-100 bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-700 shadow-[inset_0_-1px_0_rgba(0,0,0,0.06)]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
