import { cn } from "@/lib/cn";
import type { WordPart } from "@/lib/law/types";

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
        "whitespace-pre-wrap text-[15px] leading-[1.7] text-ink-900",
        className,
      )}
    >
      {parts.map((p, i) => {
        if (p.added)
          return (
            <mark
              key={i}
              className="rounded bg-emerald-100 px-1 font-semibold text-emerald-900 ring-1 ring-emerald-300"
            >
              {p.value}
            </mark>
          );
        if (p.removed)
          return (
            <mark
              key={i}
              className="rounded bg-rose-100 px-1 text-rose-900 line-through ring-1 ring-rose-300"
            >
              {p.value}
            </mark>
          );
        return <span key={i}>{p.value}</span>;
      })}
    </p>
  );
}
