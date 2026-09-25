"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import type { BillDetail, ChangeType, FilterStatus } from "@/lib/mock";
import { StageBar } from "@/components/law/stage-bar";
import { ClauseCompare } from "@/components/law/clause-compare";
import { ChangeBadge } from "@/components/law/change-badge";
import { GroupCard } from "@/components/feedback/group-card";
import { Kbd } from "@/components/ui/kbd";

type Tab = "compare" | "citizen";
type Filter = "ALL" | ChangeType;

const filters: Array<{ key: Filter; label: string }> = [
  { key: "ALL", label: "Бүгд" },
  { key: "ADDED", label: "Нэмсэн" },
  { key: "REMOVED", label: "Хассан" },
  { key: "CHANGED", label: "Өөрчилсөн" },
];

// Шүүлтийн шошгын монгол нэр
const filterLabels: Record<FilterStatus, string> = {
  RELEVANT: "Хамааралтай",
  OFF_TOPIC: "Сэдвээс гадуур",
  ABUSIVE: "Утгагүй / доромжилсон",
  DUPLICATE: "Давхардсан",
};

// live=true бол товчнууд DB-д хадгална. Демо (mock) төсөлд false.
export function BillWorkbench({ bill, live = false }: { bill: BillDetail; live?: boolean }) {
  const router = useRouter();
  const [grouping, setGrouping] = useState(false);
  const [tab, setTab] = useState<Tab>("compare");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [approved, setApproved] = useState<Record<string, boolean>>(
    () => Object.fromEntries(bill.clauses.map((c) => [c.id, c.approved])),
  );
  const [active, setActive] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return bill.clauses.filter((c) => {
      if (c.changeType === "UNCHANGED") return false;
      if (filter === "ALL") return true;
      return c.changeType === filter;
    });
  }, [bill.clauses, filter]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1500);
  }, []);

  const toggleApprove = useCallback(
    (id: string) => {
      const next = !approved[id];
      setApproved((s) => ({ ...s, [id]: next }));
      flash(next ? "✓ Заалт батлагдлаа" : "Батлалт цуцлагдав");
      if (!live) return;
      // DB-д хадгална. Алдаа гарвал буцаана.
      fetch(`/api/clauses/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: next }),
      }).then((res) => {
        if (!res.ok) {
          setApproved((s) => ({ ...s, [id]: !next }));
          flash("Хадгалж чадсангүй");
        }
      });
    },
    [approved, flash, live],
  );

  // "Санал бүлэглэх": шинэ саналуудыг AI-аар шүүж → бүлэглэж → хариуны ноорог бичнэ
  async function runGrouping() {
    if (!live) {
      flash("Демо төсөлд бүлэглэх боломжгүй");
      return;
    }
    setGrouping(true);
    try {
      const res = await fetch(`/api/bills/${bill.id}/group`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        flash(data.error ?? "Алдаа гарлаа");
      } else {
        flash(`${data.newComments} шинэ санал · ${data.filtered} шүүгдсэн · ${data.groups} шинэ бүлэг`);
        router.refresh();
      }
    } catch {
      flash("Алдаа гарлаа");
    }
    setGrouping(false);
  }

  // Шүүгдсэн саналыг буцааж хамааралтай болгоно
  async function restoreComment(commentId: string) {
    const res = await fetch(`/api/comments/${commentId}/restore`, { method: "POST" });
    if (res.ok) {
      flash("Сэргээлээ. Дараагийн бүлэглэлтэд орно.");
      router.refresh();
    } else {
      flash("Сэргээж чадсангүй");
    }
  }

  // Тоолуур: N санал → M шүүгдсэн → K бүлэг
  let groupedCommentCount = 0;
  let filteredCount = 0;
  let groupCount = 0;
  for (const c of bill.clauses) {
    filteredCount += c.filtered.length;
    groupCount += c.groups.length;
    for (const g of c.groups) groupedCommentCount += g.commentCount;
  }
  const totalCommentCount = groupedCommentCount + filteredCount;

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      if (tab !== "compare") return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        setActive((i) => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
      } else if (e.key.toLowerCase() === "a") {
        const c = filtered[active];
        if (c) toggleApprove(c.id);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [filtered, active, tab, toggleApprove]);

  const changedCount = bill.clauses.filter(
    (c) => c.changeType !== "UNCHANGED",
  ).length;
  const unapprovedCount = bill.clauses.filter(
    (c) => c.changeType !== "UNCHANGED" && !approved[c.id],
  ).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-[0_20px_45px_-30px_rgba(15,42,99,0.3)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-parliament-500">
              Ажлын ширээ · {bill.id}
            </div>
            <h1 className="mt-1 font-editorial text-2xl font-medium text-parliament-900">
              {bill.title}
            </h1>
            {bill.reasonText ? (
              <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
                {bill.reasonText}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/api/bills/${bill.id}/word`}
              className="inline-flex items-center gap-2 rounded-full bg-parliament-700 px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-parliament-800"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                <path
                  d="M10 3v10m0 0-4-4m4 4 4-4M4 17h12"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Word татах
            </a>
          </div>
        </div>

        <div className="mt-5">
          <StageBar current={bill.stage} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-ink-100 pt-4">
          <Metric label="Өөрчлөгдсөн заалт" value={changedCount} />
          <Metric
            label="Батлагдаагүй"
            value={unapprovedCount}
            tone={unapprovedCount ? "warn" : "good"}
          />
          <Metric label="Иргэдийн санал" value={totalCommentCount} />
          <Metric label="Шүүгдсэн" value={filteredCount} />
        </div>
      </section>

      {/* Tabs */}
      <div className="flex items-end justify-between border-b border-ink-100">
        <div className="flex items-end gap-1">
          {(["compare", "citizen"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "relative -mb-px px-4 py-2.5 text-[13px] font-semibold transition",
                tab === t
                  ? "text-parliament-700"
                  : "text-ink-500 hover:text-parliament-700",
              )}
            >
              {t === "compare" ? "Харьцуулалт" : "Иргэдийн санал"}
              {tab === t ? (
                <span className="absolute inset-x-3 -bottom-px h-[3px] rounded-full bg-parliament-700" />
              ) : null}
            </button>
          ))}
        </div>
        {tab === "compare" ? (
          <div className="hidden items-center gap-2 text-[10.5px] text-ink-500 md:flex">
            <Kbd>↑</Kbd><Kbd>↓</Kbd> мөр · <Kbd>A</Kbd> батлах
          </div>
        ) : null}
      </div>

      {tab === "compare" ? (
        <>
          {/* Filter chips */}
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((f) => {
              const count =
                f.key === "ALL"
                  ? changedCount
                  : bill.clauses.filter((c) => c.changeType === f.key).length;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11.5px] font-semibold transition",
                    filter === f.key
                      ? "border-parliament-700 bg-parliament-700 text-white"
                      : "border-ink-100 bg-white text-ink-700 hover:border-parliament-500 hover:text-parliament-700",
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[10px] font-bold",
                      filter === f.key
                        ? "bg-white/20 text-white"
                        : "bg-ink-100 text-ink-500",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Clause cards */}
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-100 bg-white p-10 text-center text-[13px] text-ink-500">
              Тохирох заалт алга. Шүүлтүүрээ өөрчилнө үү.
            </div>
          ) : (
            <ol className="flex flex-col gap-4">
              {filtered.map((c, i) => {
                const isActive = i === active;
                const isApproved = approved[c.id];
                return (
                  <li
                    key={c.id}
                    onClick={() => setActive(i)}
                    className={cn(
                      "cursor-pointer rounded-2xl border bg-white p-5 shadow-[0_18px_40px_-30px_rgba(15,42,99,0.3)] transition",
                      isActive
                        ? "border-parliament-500 ring-2 ring-parliament-100"
                        : "border-ink-100 hover:border-parliament-200",
                    )}
                  >
                    <header className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold",
                          isActive
                            ? "bg-parliament-700 text-white"
                            : "bg-ink-100 text-ink-500",
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="rounded-md bg-parliament-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-parliament-700">
                        {c.number}
                      </span>
                      <ChangeBadge type={c.changeType} />
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">
                          ✓ Батлагдсан
                        </span>
                      ) : null}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleApprove(c.id);
                        }}
                        className={cn(
                          "ml-auto rounded-full px-3.5 py-1 text-[11px] font-semibold transition",
                          isApproved
                            ? "bg-ink-100 text-ink-700 hover:bg-ink-200"
                            : "bg-parliament-700 text-white hover:bg-parliament-800",
                        )}
                      >
                        {isApproved ? "Цуцлах" : "Батлах"}
                      </button>
                    </header>

                    {c.applyError ? (
                      <div className="mt-3 rounded-lg border border-gold-300 bg-gold-100/60 p-2.5 text-[12px] font-medium text-ink-900">
                        ⚠️ Автоматаар хэрэгжүүлж чадсангүй: {c.applyError} Гараар шалгана уу.
                      </div>
                    ) : null}

                    <div className="mt-4">
                      <ClauseCompare
                        oldText={c.oldText}
                        newText={c.newText}
                        diff={c.diff}
                      />
                    </div>

                    {c.sourceQuote ? (
                      <div className="mt-3 rounded-lg bg-parliament-50/60 p-2.5 text-[11.5px] italic text-parliament-900">
                        <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider not-italic text-parliament-500">
                          Эх сурвалж
                        </span>
                        «{c.sourceQuote}»
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[12.5px] text-ink-500">
                Иргэдийн саналыг AI-аар шүүж, агуулгаар нь бүлэглэсэн. Ноорог хариу
                засаад «Тусгасан / Тусгаагүй» сонго.
              </p>
              <p className="mt-1 text-[13px] font-semibold text-parliament-900">
                {totalCommentCount} санал → {filteredCount} шүүгдсэн → {groupCount} бүлэг
              </p>
            </div>
            <button
              onClick={runGrouping}
              disabled={grouping}
              className="inline-flex items-center gap-2 rounded-full bg-parliament-700 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-parliament-800 disabled:opacity-60"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                <path
                  d="M15 8A5 5 0 0 0 6 5l-2 3M5 12a5 5 0 0 0 9 3l2-3"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {grouping ? "AI ажиллаж байна..." : "Санал бүлэглэх"}
            </button>
          </div>

          {bill.clauses.every((c) => !c.groups.length && !c.filtered.length) ? (
            <div className="rounded-2xl border border-dashed border-ink-100 bg-white p-10 text-center text-[13px] text-ink-500">
              Бүлэглэсэн санал алга. Иргэд санал өгсний дараа «Санал бүлэглэх» товчийг дарна уу.
            </div>
          ) : null}

          {bill.clauses
            .filter((c) => c.groups.length || c.filtered.length)
            .map((c) => (
              <section key={c.id} className="flex flex-col gap-3">
                <header className="flex items-center gap-2 border-b border-ink-100 pb-2">
                  <span className="rounded-md bg-parliament-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-parliament-700">
                    {c.number}
                  </span>
                  <span className="text-[12px] font-medium text-ink-700">
                    {c.groups.length} бүлэг ·{" "}
                    {c.groups.reduce((a, g) => a + g.commentCount, 0).toLocaleString("mn-MN")}{" "}
                    санал
                  </span>
                </header>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {c.groups.map((g) => (
                    <GroupCard key={g.id} group={g} live={live} />
                  ))}
                </div>

                {c.filtered.length ? (
                  <details className="rounded-xl border border-ink-100 bg-white p-3">
                    <summary className="cursor-pointer text-[12px] font-semibold text-ink-700">
                      Шүүгдсэн ({c.filtered.length})
                    </summary>
                    <ul className="mt-2 flex flex-col gap-2">
                      {c.filtered.map((f) => (
                        <li
                          key={f.id}
                          className="flex flex-wrap items-start gap-2 rounded-lg bg-ink-100/40 p-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-rose-700">
                              {filterLabels[f.filterStatus]}
                            </div>
                            <p className="mt-0.5 text-[12.5px] text-ink-900">«{f.text}»</p>
                            {f.filterReason ? (
                              <p className="mt-0.5 text-[11.5px] text-ink-500">{f.filterReason}</p>
                            ) : null}
                          </div>
                          {live ? (
                            <button
                              onClick={() => restoreComment(f.id)}
                              className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-parliament-700 ring-1 ring-inset ring-parliament-200 hover:bg-parliament-50"
                            >
                              Сэргээх
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </section>
            ))}
        </div>
      )}

      <div
        className={cn(
          "pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-parliament-950 px-4 py-2 text-[12px] font-medium text-white shadow-lg transition-all duration-300",
          toast ? "opacity-100" : "opacity-0 translate-y-2",
        )}
      >
        {toast}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "warn" | "good";
}) {
  const c = {
    neutral: "bg-parliament-50 text-parliament-800",
    warn: "bg-gold-100 text-gold-500",
    good: "bg-emerald-100 text-emerald-800",
  }[tone];
  return (
    <div className={cn("rounded-xl px-3 py-2 text-center", c)}>
      <div className="text-[10.5px] font-semibold uppercase tracking-wider opacity-80">
        {label}
      </div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
    </div>
  );
}
