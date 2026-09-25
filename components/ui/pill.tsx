import { cn } from "@/lib/cn";

// Жижиг шошго. Бүх өнгө WCAG AA давсан.
type Tone = "neutral" | "brand" | "point" | "ok" | "bad";

const tones: Record<Tone, string> = {
  neutral: "bg-ink-100 text-ink-700",
  brand: "bg-brand-100 text-brand-800",
  point: "bg-point-100 text-point-700",
  ok: "bg-ok-100 text-ok-800",
  bad: "bg-bad-100 text-bad-800",
};

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
