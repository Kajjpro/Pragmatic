"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { LawClause } from "@/lib/stub/types";
import { StatusPill } from "@/components/ui/status-pill";
import { OpinionForm } from "@/components/feedback/opinion-form";

export function ClauseCard({ clause }: { clause: LawClause }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="rounded-2xl border border-ink-100 bg-white shadow-[0_18px_45px_-30px_rgba(15,42,99,0.3)] animate-rise">
      <header className="flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-3">
          <StatusPill tone="info">{clause.number}</StatusPill>
          <span className="text-[11.5px] text-ink-500">
            {(clause.opinionCounts.support +
              clause.opinionCounts.oppose +
              clause.opinionCounts.neutral).toLocaleString("mn-MN")} санал
          </span>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-full border border-ink-100 px-3 py-1 text-[11px] font-semibold text-parliament-800 transition hover:border-parliament-500"
        >
          {open ? "Хураах" : "Энгийн тайлбар үзэх"}
        </button>
      </header>

      <div className="border-t border-ink-100 px-5 py-4">
        <p className={cn(
          "text-[13px] leading-relaxed text-ink-700 transition-all",
          !open && "line-clamp-2",
        )}>
          {clause.originalText}
        </p>
        {open ? (
          <div className="mt-3 rounded-xl bg-parliament-50/70 p-3 text-[12.5px] leading-relaxed text-parliament-900">
            <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-parliament-700">
              Энгийн тайлбар
            </div>
            {clause.plainText}
          </div>
        ) : null}
      </div>

      {open ? (
        <div className="border-t border-ink-100 px-5 py-4">
          <OpinionForm clauseNumber={clause.number} />
          {clause.clusters.length ? (
            <div className="mt-4 flex flex-col gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                Иргэдийн санааны бүлгүүд
              </div>
              {clause.clusters.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-ink-100 bg-parliament-50/30 p-3"
                >
                  <div className="flex items-center gap-2">
                    <StatusPill
                      tone={
                        c.stance === "support"
                          ? "good"
                          : c.stance === "oppose"
                            ? "danger"
                            : "neutral"
                      }
                    >
                      {c.stance === "support"
                        ? "Дэмжсэн"
                        : c.stance === "oppose"
                          ? "Эсэргүүцсэн"
                          : "Саармаг"}
                    </StatusPill>
                    <span className="text-[11px] font-medium text-ink-500">
                      {c.count.toLocaleString("mn-MN")} санал
                    </span>
                  </div>
                  <div className="mt-1.5 text-[13px] font-semibold text-ink-900">
                    {c.label}
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-500">
                    {c.summary}
                  </p>
                  {c.response ? (
                    <div className="mt-2 rounded-lg bg-white p-2.5 text-[12px] text-parliament-800 ring-1 ring-parliament-100">
                      <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-parliament-500">
                        Комиссын хариу
                      </span>
                      {c.response}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
