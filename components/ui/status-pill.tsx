import { cn } from "@/lib/cn";

const tones: Record<string, string> = {
  neutral: "bg-ink-100 text-ink-700",
  info: "bg-parliament-100 text-parliament-800",
  warn: "bg-amber-100 text-amber-800",
  danger: "bg-rose-100 text-rose-800",
  good: "bg-emerald-100 text-emerald-800",
};

export function StatusPill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold tracking-[0.04em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
