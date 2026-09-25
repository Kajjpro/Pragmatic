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
import { Kbd } from "@/components/ui/kbd";

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
  const [approved, setApproved] = useState<Record<string, boolean>>(
    () => Object.fromEntries(bill.clauses.map((c) => [c.id, c.approved])),
  );
  const [active, setActive] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [grouping, setGrouping] = useState(false);

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

  // Батлах товч — DB-д хадгална. Иргэн зөвхөн батлагдсан заалтыг хардаг тул
  // энэ нь заавал сервер рүү очих ёстой.
  const toggleApprove = useCallback(
    async (id: string) => {
      const next = !approved[id];
      setApproved((s) => ({ ...s, [id]: next })); // шууд харагдана
      try {
        const res = await fetch(`/api/clauses/${id}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved: next }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setApproved((s) => ({ ...s, [id]: !next })); // алдаа гарвал буцаана
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

  // AI-аар шүүж, бүлэглэж, ноорог хариу бичүүлнэ. Дараа нь хуудсыг шинэчилнэ.
  const runGrouping = useCallback(async () => {
    setGrouping(true);
    try {
      const res = await fetch(`/api/bills/${bill.id}/group`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        flash(data?.error ?? "Бүлэглэхэд алдаа гарлаа");
        return;
      }
      flash("✓ Санал бүлэглэгдлээ");
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
            <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-parliament-600">
              Ажлын ширээ
            </div>
            <h1 className="mt-1 font-editorial text-2xl font-medium text-parliament-900">
              {bill.title}
            </h1>
            {bill.reasonText ? (
              <p className="mt-2 text-[14px] leading-relaxed text-ink-700">
                {bill.reasonText}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/api/bills/${bill.id}/word`}
              className="press inline-flex min-h-11 items-center gap-2 rounded-full bg-parliament-700 px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-parliament-800"
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
          <Metric
            label="Иргэдийн санал"
            value={bill.clauses.reduce(
              (a, c) => a + c.groups.reduce((b, g) => b + g.commentCount, 0),
              0,
            )}
          />
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
                "press relative -mb-px min-h-11 px-4 text-[14px] font-semibold",
                tab === t
                  ? "text-parliament-900"
                  : "text-ink-600 hover:text-parliament-700",
              )}
            >
              {t === "compare" ? "Харьцуулалт" : "Иргэдийн санал"}
              {tab === t ? (
                <span className="absolute inset-x-3 -bottom-px h-[3px] rounded-full bg-gold-400" />
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
                    "press inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold",
                    filter === f.key
                      ? "border-gold-400 bg-gold-400 text-parliament-950 shadow-sm"
                      : "border-ink-200 bg-white text-ink-700 hover:border-parliament-400 hover:text-parliament-700",
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[11px] font-bold tabular-nums",
                      filter === f.key
                        ? "bg-parliament-950/15 text-parliament-950"
                        : "bg-ink-100 text-ink-600",
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
            <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center text-[14px] text-ink-600">
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
                      "card-lift cursor-pointer rounded-2xl border bg-white p-5 shadow-[0_18px_40px_-30px_rgba(15,42,99,0.3)]",
                      isActive
                        ? "border-gold-400 ring-2 ring-gold-200"
                        : "border-ink-200 hover:border-parliament-300 hover:shadow-[0_24px_50px_-30px_rgba(15,42,99,0.45)]",
                    )}
                  >
                    <header className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold tabular-nums",
                          isActive
                            ? "bg-gold-400 text-parliament-950"
                            : "bg-ink-100 text-ink-600",
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
                          "press ml-auto min-h-11 rounded-full px-4 text-[13px] font-bold",
                          isApproved
                            ? "bg-ink-100 text-ink-700 hover:bg-ink-200"
                            : "bg-gold-400 text-parliament-950 shadow-sm hover:bg-gold-300",
                        )}
                      >
                        {isApproved ? "Цуцлах" : "Батлах"}
                      </button>
                    </header>

                    <div className="mt-4">
                      <ClauseCompare
                        oldText={c.oldText}
                        newText={c.newText}
                        diff={c.diff}
                      />
                    </div>

                    {c.sourceQuote ? (
                      <div className="mt-3 rounded-lg bg-parliament-50 p-3 text-[13px] italic text-parliament-900">
                        <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider not-italic text-parliament-600">
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
            <p className="max-w-xl text-[14px] leading-relaxed text-ink-700">
              Иргэдийн саналыг AI-аар агуулгаар нь бүлэглэсэн. Ноорог хариу
              засаад «Тусгасан / Тусгаагүй» сонго.
            </p>
            <button
              onClick={runGrouping}
              disabled={grouping}
              className="press inline-flex min-h-11 items-center gap-2 rounded-full bg-gold-400 px-4 text-[13px] font-bold text-parliament-950 shadow-sm hover:bg-gold-300 disabled:opacity-60"
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
              {grouping ? "Бүлэглэж байна…" : "Санал бүлэглэх"}
            </button>
          </div>

          {bill.clauses
            .filter((c) => c.groups.length)
            .map((c) => (
              <section key={c.id} className="flex flex-col gap-3">
                <header className="flex items-center gap-2 border-b border-ink-100 pb-2">
                  <span className="rounded-md bg-parliament-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-parliament-700">
                    {c.number}
                  </span>
                  <span className="text-[13px] font-medium text-ink-700">
                    {c.groups.length} бүлэг ·{" "}
                    {c.groups.reduce((a, g) => a + g.commentCount, 0).toLocaleString("mn-MN")}{" "}
                    санал
                  </span>
                </header>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {c.groups.map((g) => (
                    <GroupCard key={g.id} group={g} />
                  ))}
                </div>
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
    warn: "bg-gold-100 text-gold-700",
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
