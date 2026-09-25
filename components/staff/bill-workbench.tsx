"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import type { BillDetail } from "@/lib/law/queries";
import type { ChangeType } from "@/lib/law/types";
import { StageBar } from "@/components/law/stage-bar";
import { ClauseCompare } from "@/components/law/clause-compare";
import { ChangeBadge } from "@/components/law/change-badge";
import { GroupCard } from "@/components/feedback/group-card";
import { FilteredList } from "@/components/staff/filtered-list";
import { Kbd } from "@/components/ui/kbd";

// Ажилтны ажлын ширээ. Компьютер/проекторт зориулсан — үсэг том,
// 5 метрээс уншигдахаар. Логик хэвээр, зөвхөн харагдац шинэчлэгдсэн.
type Tab = "compare" | "citizen";
type Filter = "ALL" | ChangeType;

const filters: Array<{ key: Filter; label: string }> = [
  { key: "ALL", label: "Бүгд" },
  { key: "ADDED", label: "Нэмсэн" },
  { key: "REMOVED", label: "Хассан" },
  { key: "CHANGED", label: "Өөрчилсөн" },
];

export function BillWorkbench({ bill }: { bill: BillDetail }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("compare");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [approved, setApproved] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(bill.clauses.map((c) => [c.id, c.approved])),
  );
  const [active, setActive] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [grouping, setGrouping] = useState(false);

  const filtered = useMemo(
    () =>
      bill.clauses.filter((c) => {
        if (c.changeType === "UNCHANGED") return false;
        if (filter === "ALL") return true;
        return c.changeType === filter;
      }),
    [bill.clauses, filter],
  );

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }, []);

  // Батлах — DB-д хадгална. Иргэн зөвхөн батлагдсан заалтыг хардаг.
  const toggleApprove = useCallback(
    async (id: string) => {
      const next = !approved[id];
      setApproved((s) => ({ ...s, [id]: next }));
      try {
        const res = await fetch(`/api/clauses/${id}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved: next }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setApproved((s) => ({ ...s, [id]: !next }));
          flash(data?.error ?? "Хадгалахад алдаа гарлаа");
          return;
        }
        flash(next ? "✓ Заалт батлагдлаа" : "Батлалт цуцлагдав");
      } catch {
        setApproved((s) => ({ ...s, [id]: !next }));
        flash("Сүлжээний алдаа. Дахин оролдоно уу.");
      }
    },
    [approved, flash],
  );

  // AI-аар шүүж, бүлэглэж, ноорог хариу бичүүлнэ.
  const runGrouping = useCallback(async () => {
    setGrouping(true);
    try {
      const res = await fetch(`/api/bills/${bill.id}/group`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        flash(data?.error ?? "Бүлэглэхэд алдаа гарлаа");
        return;
      }
      flash("✓ Санал шүүгдэж, бүлэглэгдлээ");
      router.refresh();
    } catch {
      flash("Сүлжээний алдаа. Дахин оролдоно уу.");
    } finally {
      setGrouping(false);
    }
  }, [bill.id, flash, router]);

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

  const changed = bill.clauses.filter((c) => c.changeType !== "UNCHANGED");
  const changedCount = changed.length;
  const unapprovedCount = changed.filter((c) => !approved[c.id]).length;

  // Юүлүүр: хэдэн санал ирсэн → хэд нь шүүгдсэн → хэдэн бүлэг болсон
  const groupedCount = bill.clauses.reduce(
    (a, c) => a + c.groups.reduce((b, g) => b + g.commentCount, 0),
    0,
  );
  const filteredCount = bill.clauses.reduce((a, c) => a + c.filtered.length, 0);
  const groupCount = bill.clauses.reduce((a, c) => a + c.groups.length, 0);
  const totalComments = groupedCount + filteredCount;

  return (
    <div className="flex flex-col gap-7">
      {/* Толгой */}
      <section className="rounded-3xl border border-ink-200 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-4xl">
            <div className="text-[14px] font-extrabold uppercase tracking-[0.12em] text-brand-700">
              Ажлын ширээ
            </div>
            <h1 className="mt-1.5 text-[30px] font-extrabold leading-tight tracking-tight text-ink-950 xl:text-[36px]">
              {bill.title}
            </h1>
            {bill.reasonText ? (
              <p className="mt-3 text-[17px] leading-relaxed text-ink-700">
                {bill.reasonText}
              </p>
            ) : null}
          </div>

          <a
            href={`/api/bills/${bill.id}/word`}
            className="press inline-flex min-h-14 items-center gap-2 rounded-2xl bg-brand-600 px-6 text-[17px] font-extrabold text-white shadow-brand hover:bg-brand-700"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
              <path
                d="M10 3v10m0 0-4-4m4 4 4-4M4 17h12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Word татах
          </a>
        </div>

        <div className="mt-6">
          <StageBar current={bill.stage} />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-ink-100 pt-5">
          <Metric label="Өөрчлөгдсөн заалт" value={changedCount} />
          <Metric
            label="Батлагдаагүй"
            value={unapprovedCount}
            tone={unapprovedCount ? "warn" : "good"}
          />
          <Metric label="Залуучуудын санал" value={totalComments} />
        </div>
      </section>

      {/* Табууд */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink-200">
        <div className="flex items-end gap-1">
          {(["compare", "citizen"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              aria-current={tab === t ? "page" : undefined}
              className={cn(
                "press relative -mb-0.5 min-h-14 px-5 text-[19px] font-extrabold",
                tab === t ? "text-brand-700" : "text-ink-600 hover:text-ink-900",
              )}
            >
              {t === "compare" ? "Харьцуулалт" : "Залуучуудын санал"}
              {tab === t ? (
                <span className="absolute inset-x-3 -bottom-0.5 h-1 rounded-full bg-brand-600" />
              ) : null}
            </button>
          ))}
        </div>
        {tab === "compare" ? (
          <div className="hidden items-center gap-2 pb-3 text-[14px] text-ink-600 md:flex">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> мөр · <Kbd>A</Kbd> батлах
          </div>
        ) : null}
      </div>

      {tab === "compare" ? (
        <>
          <div className="flex flex-wrap items-center gap-2.5">
            {filters.map((f) => {
              const count =
                f.key === "ALL"
                  ? changedCount
                  : changed.filter((c) => c.changeType === f.key).length;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  aria-pressed={filter === f.key}
                  className={cn(
                    "press inline-flex min-h-12 items-center gap-2 rounded-2xl border-2 px-5 text-[16px] font-extrabold",
                    filter === f.key
                      ? "border-brand-600 bg-brand-600 text-white shadow-brand"
                      : "border-ink-200 bg-white text-ink-700 hover:border-brand-400 hover:text-brand-700",
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      "rounded-full px-2 text-[14px] font-extrabold tabular-nums",
                      filter === f.key ? "bg-white/20 text-white" : "bg-ink-100 text-ink-700",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-ink-200 bg-white p-12 text-center text-[17px] text-ink-600">
              Тохирох заалт алга. Шүүлтүүрээ өөрчилнө үү.
            </div>
          ) : (
            <ol className="flex flex-col gap-5">
              {filtered.map((c, i) => {
                const isActive = i === active;
                const isApproved = approved[c.id];
                return (
                  <li
                    key={c.id}
                    onClick={() => setActive(i)}
                    className={cn(
                      "cursor-pointer rounded-3xl border-2 bg-white p-6 shadow-card transition-colors",
                      isActive
                        ? "border-brand-500 ring-4 ring-brand-100"
                        : "border-ink-200 hover:border-brand-300",
                    )}
                  >
                    <header className="flex flex-wrap items-center gap-3">
                      <span
                        className={cn(
                          "grid h-9 w-9 place-items-center rounded-xl text-[16px] font-extrabold tabular-nums",
                          isActive ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-700",
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="rounded-lg bg-brand-50 px-3 py-1 font-mono text-[16px] font-extrabold text-brand-700">
                        {c.number}
                      </span>
                      <ChangeBadge type={c.changeType} />
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-ok-100 px-3 py-1 text-[14px] font-extrabold text-ok-800 ring-1 ring-inset ring-ok-500/40">
                          ✓ Батлагдсан
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleApprove(c.id);
                        }}
                        className={cn(
                          "press ml-auto min-h-14 rounded-2xl px-7 text-[17px] font-extrabold",
                          isApproved
                            ? "bg-ink-100 text-ink-700 hover:bg-ink-200"
                            : "bg-brand-600 text-white shadow-brand hover:bg-brand-700",
                        )}
                      >
                        {isApproved ? "Цуцлах" : "Батлах"}
                      </button>
                    </header>

                    <div className="mt-5">
                      <ClauseCompare oldText={c.oldText} newText={c.newText} diff={c.diff} />
                    </div>

                    {c.sourceQuote ? (
                      <div className="mt-4 rounded-2xl border-l-4 border-brand-600 bg-brand-50 p-4 text-[16px] italic leading-relaxed text-ink-900">
                        <span className="mr-2 text-[13px] font-extrabold uppercase not-italic tracking-wider text-brand-700">
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
        <div className="flex flex-col gap-7">
          {/* Юүлүүр — энэ бол "бид зүгээр нэг иргэний апп биш" гэдгийн баталгаа */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-ink-200 bg-white p-6 shadow-card">
            <div className="flex flex-wrap items-center gap-3 text-[20px] font-extrabold text-ink-950 xl:text-[24px]">
              <Funnel value={totalComments} label="санал" />
              <span aria-hidden className="text-ink-300">
                →
              </span>
              <Funnel value={filteredCount} label="шүүгдсэн" tone="bad" />
              <span aria-hidden className="text-ink-300">
                →
              </span>
              <Funnel value={groupCount} label="бүлэг" tone="brand" />
            </div>

            <button
              type="button"
              onClick={runGrouping}
              disabled={grouping}
              className="press inline-flex min-h-14 items-center gap-2 rounded-2xl bg-brand-600 px-6 text-[17px] font-extrabold text-white shadow-brand hover:bg-brand-700 disabled:opacity-60"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
                <path
                  d="M15 8A5 5 0 0 0 6 5l-2 3M5 12a5 5 0 0 0 9 3l2-3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {grouping ? "Бүлэглэж байна…" : "Санал бүлэглэх"}
            </button>
          </div>

          <p className="max-w-3xl text-[17px] leading-relaxed text-ink-700">
            AI хамааралгүй саналыг шүүж (устгахгүй), үлдсэнийг агуулгаар нь
            бүлэглэсэн. Ноорог хариуг засаад «Тусгасан / Тусгаагүй» сонгоход
            иргэнд мэдэгдэл, тэмдэг очно.
          </p>

          {bill.clauses.filter((c) => c.groups.length || c.filtered.length).length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-ink-200 bg-white p-12 text-center text-[17px] text-ink-600">
              Одоогоор санал ирээгүй байна. Санал ирмэгц «Санал бүлэглэх» дарна уу.
            </div>
          ) : (
            bill.clauses
              .filter((c) => c.groups.length || c.filtered.length)
              .map((c) => (
                <section key={c.id} className="flex flex-col gap-4">
                  <header className="flex flex-wrap items-center gap-3 border-b-2 border-ink-100 pb-3">
                    <span className="rounded-lg bg-brand-50 px-3 py-1 font-mono text-[16px] font-extrabold text-brand-700">
                      {c.number}
                    </span>
                    <span className="text-[17px] font-bold text-ink-700">
                      {c.groups.length} бүлэг ·{" "}
                      {c.groups
                        .reduce((a, g) => a + g.commentCount, 0)
                        .toLocaleString("mn-MN")}{" "}
                      санал
                    </span>
                  </header>

                  {c.groups.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      {c.groups.map((g) => (
                        <GroupCard
                          key={g.id}
                          group={g}
                          onSaved={(reflection) =>
                            flash(
                              reflection === "REFLECTED"
                                ? "Иргэдэд мэдэгдэл ба тэмдэг илгээгдлээ"
                                : "Хариу хадгалагдлаа",
                            )
                          }
                        />
                      ))}
                    </div>
                  ) : null}

                  {/* Шүүгдсэн саналууд — устгаагүй, ажилтан буцаах боломжтой */}
                  <FilteredList
                    clauseNumber={c.number}
                    items={c.filtered}
                    onRestored={flash}
                  />
                </section>
              ))
          )}
        </div>
      )}

      {/* Мэдэгдэл */}
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "pointer-events-none fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-ink-950 px-6 py-4 text-[17px] font-bold text-white shadow-lift transition-all duration-300",
          toast ? "opacity-100" : "translate-y-3 opacity-0",
        )}
      >
        {toast}
      </div>
    </div>
  );
}

// Юүлүүрийн нэг тоо
function Funnel({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone?: "bad" | "brand";
}) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <b
        className={cn(
          "tabular-nums",
          tone === "bad" ? "text-bad-800" : tone === "brand" ? "text-brand-700" : "text-ink-950",
        )}
      >
        {value.toLocaleString("mn-MN")}
      </b>
      <span className="text-[16px] font-bold text-ink-600">{label}</span>
    </span>
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
    neutral: "bg-brand-50 text-brand-800",
    warn: "bg-point-100 text-point-700",
    good: "bg-ok-100 text-ok-800",
  }[tone];
  return (
    <div className={cn("rounded-2xl px-5 py-3 text-center", c)}>
      <div className="text-[13px] font-extrabold uppercase tracking-wider opacity-80">
        {label}
      </div>
      <div className="text-[28px] font-extrabold tabular-nums">{value}</div>
    </div>
  );
}
