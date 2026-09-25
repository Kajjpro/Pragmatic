import { cn } from "@/lib/cn";
import type { WordPart } from "@/lib/mock";

// Үг тус бүрийн зөрүү: улаан = хасагдсан + strikethrough, ногоон = нэмэгдсэн.
export function DiffText({
  parts,
  className,
}: {
  parts: WordPart[];
  className?: string;
}) {
  return (
    <p
      className={cn(
        "whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-900",
        className,
      )}
    >
      {parts.map((p, i) => {
        if (p.added)
          return (
            <mark
              key={i}
              className="rounded bg-emerald-100 px-0.5 text-emerald-900"
            >
              {p.value}
            </mark>
          );
        if (p.removed)
          return (
            <mark
              key={i}
              className="rounded bg-rose-100 px-0.5 text-rose-900 line-through"
            >
              {p.value}
            </mark>
          );
        return <span key={i}>{p.value}</span>;
      })}
    </p>
  );
}
