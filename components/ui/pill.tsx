import { cn } from "@/lib/cn";

// Жижиг шошго (төрөл, төлөв). Өнгө бүр текстээрээ ч утгаа илэрхийлнэ.
type Tone = "neutral" | "action" | "good" | "bad" | "warn" | "gold";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted",
  action: "bg-action-bg text-action",
  good: "bg-good-bg text-good-fg",
  bad: "bg-bad-bg text-bad-fg",
  warn: "bg-warn-bg text-warn-fg",
  gold: "bg-gold-bg text-gold-fg",
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
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[13px] font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
