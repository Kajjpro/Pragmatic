"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { WordPart } from "@/lib/law/types";
import { DiffText } from "./diff-text";

type View = "before" | "after" | "diff";

// Нэг заалтын харьцуулалт.
// Компьютерт: "Хүчин төгөлдөр хууль" | "Шинэ төсөл" хоёр багана зэрэгцэнэ.
// Гар утсанд: "Өмнө | Дараа | Ялгаа" сонголт (анхдагч — Ялгаа, нэг мөрөнд).
export function ClauseCompare({
  oldText,
  newText,
  diff,
}: {
  oldText: string | null;
  newText: string | null;
  diff: WordPart[];
}) {
  const [view, setView] = useState<View>("diff");
  const before = diff.filter((p) => !p.added);
  const after = diff.filter((p) => !p.removed);

  const beforeBody = oldText ? <DiffText parts={before} /> : <Missing text="Одоогийн хуульд энэ заалт байхгүй (шинээр нэмэгдэнэ)." />;
  const afterBody = newText ? <DiffText parts={after} /> : <Missing text="Энэ заалт хасагдана." />;

  return (
    <div>
      {/* Гар утасны сонголт */}
      <div role="tablist" aria-label="Харьцуулалтын харагдац" className="mb-3 inline-flex rounded-md border border-line bg-surface-2 p-0.5 md:hidden">
        {(
          [
            ["before", "Өмнө"],
            ["after", "Дараа"],
            ["diff", "Ялгаа"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={view === key}
            onClick={() => setView(key)}
            className={cn(
              "min-h-9 rounded px-3.5 text-[14px] font-medium",
              view === key ? "bg-surface text-heading shadow-soft" : "text-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="md:hidden">
        {view === "before" ? beforeBody : view === "after" ? afterBody : <DiffText parts={diff} />}
      </div>

      {/* Компьютерийн хоёр багана */}
      <div className="hidden gap-4 md:grid md:grid-cols-2">
        <Column label="Хүчин төгөлдөр хууль">{beforeBody}</Column>
        <Column label="Шинэ төсөл">{afterBody}</Column>
      </div>
    </div>
  );
}

function Column({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <div className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted">{label}</div>
      {children}
    </div>
  );
}

function Missing({ text }: { text: string }) {
  return <p className="text-[15px] italic text-muted">{text}</p>;
}
