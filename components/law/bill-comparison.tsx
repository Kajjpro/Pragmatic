"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/cn";
import { changeTypeLabels } from "@/lib/labels";
import type { ClauseView } from "@/lib/law/queries";
import type { ChangeType } from "@/lib/law/types";
import { ChangeBadge } from "./change-badge";
import { ChangeExplain } from "./change-explain";
import { ClauseCompare } from "./clause-compare";
import { DiffLegend } from "./diff-text";
import { ReflectionBadge } from "@/components/feedback/reflection-badge";
import { CommentForm } from "@/components/feedback/comment-form";

export type UnchangedClause = { number: string; text: string };
const TYPES: ChangeType[] = ["CHANGED", "ADDED", "REMOVED"];

// Заалт бүрийн харьцуулалт + энгийн тайлбар + иргэдийн оролцоо.
export function BillComparison({
  clauses,
  unchanged,
  commentCounts,
  isSignedIn,
}: {
  clauses: ClauseView[];
  unchanged: UnchangedClause[];
  commentCounts: Record<string, number>;
  isSignedIn: boolean;
}) {
  const [onlyChanged, setOnlyChanged] = useState(true);
  const [types, setTypes] = useState<ChangeType[]>(TYPES);

  const counts = Object.fromEntries(TYPES.map((t) => [t, clauses.filter((c) => c.changeType === t).length])) as Record<ChangeType, number>;
  const visible = clauses.filter((c) => types.includes(c.changeType));

  function toggleType(t: ChangeType) {
    setTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  }

  return (
    <div>
      {/* Хяналтын самбар */}
      <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Өөрчлөлтийн төрлөөр шүүх">
          {TYPES.filter((t) => counts[t] > 0).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={types.includes(t)}
              onClick={() => toggleType(t)}
              className={cn(
                "min-h-9 rounded-md border px-3 text-[14px] font-medium",
                types.includes(t) ? "border-primary bg-primary text-on-primary" : "border-line bg-surface text-muted",
              )}
            >
              {changeTypeLabels[t]} <span className="tabular-nums">({counts[t]})</span>
            </button>
          ))}
        </div>
        {unchanged.length > 0 ? (
          <label className="inline-flex items-center gap-2 text-[14px]">
            <input
              type="checkbox"
              checked={onlyChanged}
              onChange={(e) => setOnlyChanged(e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            Зөвхөн өөрчлөгдсөнийг харуулах
          </label>
        ) : null}
      </div>
      <div className="mt-3">
        <DiffLegend />
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 text-muted">Сонгосон төрлийн өөрчлөлт алга. Дээрх шүүлтүүрээс өөр төрөл сонгоно уу.</p>
      ) : (
        <ol className="mt-4 flex flex-col gap-5">
          {visible.map((clause) => {
            const commentCount = commentCounts[clause.id] ?? 0;
            return (
              <li key={clause.id} id={`clause-${clause.number}`} className="scroll-mt-24">
                <article className="rounded-lg border border-line bg-surface">
                  <header className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 sm:px-5">
                    <h3 className="font-sans text-[16px] font-semibold text-heading">
                      <a href={`#clause-${clause.number}`} className="hover:underline">
                        {clause.number}-р заалт
                      </a>
                    </h3>
                    <ChangeBadge type={clause.changeType} />
                    <span className="ml-auto inline-flex items-center gap-1 text-[13.5px] text-muted">
                      <MessageSquare aria-hidden className="h-4 w-4" />
                      <span className="tabular-nums">{commentCount}</span> санал
                    </span>
                  </header>

                  <div className="flex flex-col gap-4 p-4 sm:p-5">
                    <ClauseCompare oldText={clause.oldText} newText={clause.newText} diff={clause.diff} />
                    <ChangeExplain what={clause.what} why={clause.why} who={clause.who} />

                    {clause.groups.length > 0 ? (
                      <section aria-label="Иргэдийн санал ба ажлын албаны хариу" className="flex flex-col gap-3">
                        <h4 className="font-sans text-[14px] font-semibold text-heading">Иргэдийн санал ба хариу</h4>
                        {clause.groups.map((g) => (
                          <div key={g.id} className="rounded-md border border-line p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <ReflectionBadge value={g.reflection} />
                              <span className="text-[13.5px] tabular-nums text-muted">{g.commentCount} санал</span>
                            </div>
                            <p className="mt-2 font-semibold text-fg">{g.title}</p>
                            {g.summary ? <p className="mt-1 text-[15px] text-muted">{g.summary}</p> : null}
                            {g.replyText ? (
                              <blockquote className="mt-3 border-l-2 border-action pl-3 text-[15px] text-fg">
                                <span className="block text-[13px] font-semibold text-muted">УИХ-ын Тамгын газрын хариу</span>
                                {g.replyText}
                              </blockquote>
                            ) : null}
                          </div>
                        ))}
                      </section>
                    ) : null}

                    <CommentForm clauseId={clause.id} isSignedIn={isSignedIn} />
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}

      {!onlyChanged && unchanged.length > 0 ? (
        <section className="mt-6">
          <h3 className="text-[18px] font-bold">Өөрчлөгдөөгүй заалтууд</h3>
          <ol className="mt-3 flex flex-col gap-2">
            {unchanged.map((c) => (
              <li key={c.number} className="rounded-md border border-line bg-surface p-4 text-[15px]">
                <span className="font-semibold text-muted">{c.number}. </span>
                {c.text}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
