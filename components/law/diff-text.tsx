import { cn } from "@/lib/cn";
import type { WordPart } from "@/lib/law/types";

// Үг тус бүрийн ялгаа. Өнгөнөөс гадна хэлбэр (зураас / доогуур зураас) ба
// дэлгэц уншигчид зориулсан "хасагдсан / нэмэгдсэн" текстээр ялгана.
export function DiffText({ parts, className }: { parts: WordPart[]; className?: string }) {
  return (
    <p className={cn("whitespace-pre-wrap text-[16px] leading-[1.75] text-fg", className)}>
      {parts.map((p, i) => {
        if (p.added)
          return (
            <ins key={i} className="diff-add">
              <span className="sr-only">нэмэгдсэн: </span>
              {p.value}
            </ins>
          );
        if (p.removed)
          return (
            <del key={i} className="diff-del">
              <span className="sr-only">хасагдсан: </span>
              {p.value}
            </del>
          );
        return <span key={i}>{p.value}</span>;
      })}
    </p>
  );
}

// Тайлбар: өнгө юу гэсэн утгатайг нэг мөрөөр
export function DiffLegend() {
  return (
    <p className="flex flex-wrap gap-x-4 gap-y-1 text-[13.5px] text-muted">
      <span>
        <del className="diff-del">хасагдсан үг</del>
      </span>
      <span>
        <ins className="diff-add">нэмэгдсэн үг</ins>
      </span>
    </p>
  );
}
