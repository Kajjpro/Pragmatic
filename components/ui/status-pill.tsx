import { cn } from "@/lib/cn";

// Бүх хослол WCAG AA (4.5:1) давсан.
const tones: Record<string, string> = {
  neutral: "bg-ink-100 text-ink-700",
  info: "bg-brand-100 text-brand-800",
  warn: "bg-amber-100 text-amber-900",
  danger: "bg-rose-100 text-rose-800",
  good: "bg-emerald-100 text-emerald-800",
  accent: "bg-point-400 text-ink-950", // өргөлт — санал хүлээж буй
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
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-bold tracking-[0.02em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
