"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { cn } from "@/lib/cn";
import type { Directive, Report } from "@/lib/stub/types";
import { FlagBadge } from "./flag-badge";
import { ScoreCompare } from "./score-compare";
import { StatusPill } from "@/components/ui/status-pill";
import { Kbd } from "@/components/ui/kbd";
import { ClusterCard } from "@/components/feedback/cluster-card";
import { downloadReportDocx } from "@/lib/docx";

type FilterFlag = "ALL" | "HIGH" | "MEDIUM" | "LOW" | "OK";
type FilterDecision = "ALL" | "pending" | "correct" | "wrong";

const flagFilters: Array<{ key: FilterFlag; label: string }> = [
  { key: "ALL", label: "Бүгд" },
  { key: "HIGH", label: "Өндөр" },
  { key: "MEDIUM", label: "Дунд" },
  { key: "LOW", label: "Бага" },
  { key: "OK", label: "Зөв" },
];

const decisionFilters: Array<{ key: FilterDecision; label: string }> = [
  { key: "ALL", label: "Бүх шийдвэр" },
  { key: "pending", label: "Хүлээгдэж буй" },
  { key: "correct", label: "Зөв" },
  { key: "wrong", label: "Буруу" },
];

export function ReportReview({ report }: { report: Report }) {
  const [flag, setFlag] = useState<FilterFlag>("ALL");
  const [decision, setDecision] = useState<FilterDecision>("ALL");
  const [decisions, setDecisions] = useState<Record<string, Directive["decision"]>>(
    () =>
      report.directives.reduce<Record<string, Directive["decision"]>>(
        (acc, d) => {
          acc[d.id] = d.decision;
          return acc;
        },
        {},
      ),
  );
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return report.directives.filter((d) => {
      if (flag !== "ALL" && d.flag !== flag) return false;
      if (decision !== "ALL" && decisions[d.id] !== decision) return false;
      return true;
    });
  }, [report.directives, flag, decision, decisions]);

  useEffect(() => {
    if (activeIdx >= filtered.length) setActiveIdx(Math.max(0, filtered.length - 1));
  }, [filtered.length, activeIdx]);

  const activeDirective = filtered[activeIdx] ?? null;

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  }, []);

  const decide = useCallback(
    (id: string, value: Directive["decision"]) => {
      setDecisions((d) => ({ ...d, [id]: value }));
      flash(
        value === "correct"
          ? "✓ Зөв гэж тэмдэглэлээ"
          : value === "wrong"
            ? "✗ Буруу гэж тэмдэглэлээ"
            : "Шийдвэрийг цуцаллаа",
      );
    },
    [flash],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
        return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        if (activeDirective) setDrawerOpen(true);
      } else if (e.key === "Escape") {
        setDrawerOpen(false);
      } else if (e.key.toLowerCase() === "y") {
        if (activeDirective) decide(activeDirective.id, "correct");
      } else if (e.key.toLowerCase() === "n") {
        if (activeDirective) decide(activeDirective.id, "wrong");
      } else if (e.key === "?") {
        flash("Товчлол: ↑↓/j/k — мөр солих · Enter — задлах · Y — зөв · N — буруу");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filtered.length, activeDirective, decide, flash]);

  const totals = useMemo(() => {
    const t = { correct: 0, wrong: 0, pending: 0 };
    for (const d of report.directives) {
      t[decisions[d.id] ?? "pending"]++;
    }
    return t;
  }, [decisions, report.directives]);

  return (
    <div className="flex flex-col gap-6">
      <SummaryBar report={report} totals={totals} decisions={decisions} onDownload={() => downloadReportDocx(report, decisions, notes)} />

      <div className="flex flex-wrap items-center gap-3">
        <FilterGroup
          items={flagFilters}
          active={flag}
          onChange={(k) => setFlag(k as FilterFlag)}
        />
        <FilterGroup
          items={decisionFilters}
          active={decision}
          onChange={(k) => setDecision(k as FilterDecision)}
        />
        <div className="ml-auto flex items-center gap-2 text-[11px] text-ink-500">
          <span>Гарын товчлол</span>
          <Kbd>↑</Kbd><Kbd>↓</Kbd> <span>мөр</span>
          <Kbd>Y</Kbd> <span>зөв</span>
          <Kbd>N</Kbd> <span>буруу</span>
          <Kbd>↵</Kbd> <span>задлах</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-[0_20px_45px_-30px_rgba(15,42,99,0.3)]">
        <table className="w-full table-fixed text-left text-[13px]">
          <colgroup>
            <col style={{ width: 44 }} />
            <col style={{ width: 130 }} />
            <col />
            <col style={{ width: 88 }} />
            <col style={{ width: 200 }} />
            <col style={{ width: 128 }} />
          </colgroup>
          <thead className="bg-parliament-50/60 text-[10.5px] font-semibold uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-4 py-3"></th>
              <th className="px-2 py-3">Код</th>
              <th className="px-2 py-3">Зорилт</th>
              <th className="px-2 py-3">Түвшин</th>
              <th className="px-2 py-3">Үнэлгээ</th>
              <th className="px-2 py-3 text-right pr-4">Шийдвэр</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {filtered.map((d, i) => {
              const dec = decisions[d.id];
              const isActive = i === activeIdx;
              return (
                <tr
                  key={d.id}
                  onClick={() => {
                    setActiveIdx(i);
                    setDrawerOpen(true);
                  }}
                  className={cn(
                    "cursor-pointer transition",
                    isActive
                      ? "bg-parliament-50"
                      : "hover:bg-parliament-50/50",
                  )}
                >
                  <td className="px-4 py-3.5 align-top">
                    <span
                      className={cn(
                        "grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold",
                        isActive
                          ? "bg-parliament-800 text-white"
                          : "bg-ink-100 text-ink-500",
                      )}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-2 py-3.5 align-top font-mono text-[11.5px] font-semibold text-parliament-800">
                    {d.code}
                  </td>
                  <td className="px-2 py-3.5 align-top">
                    <div className="line-clamp-1 font-medium text-ink-900">
                      {d.goal}
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-ink-500">
                      {d.owner}
                    </div>
                  </td>
                  <td className="px-2 py-3.5 align-top">
                    <FlagBadge level={d.flag} />
                  </td>
                  <td className="px-2 py-3.5 align-top">
                    <ScoreCompare
                      size="sm"
                      ownerScore={d.ownerScore}
                      auditorScore={d.auditorScore}
                    />
                  </td>
                  <td className="px-2 py-3.5 pr-4 text-right align-top">
                    <DecisionButtons
                      value={dec}
                      onChange={(v) => decide(d.id, v)}
                    />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-ink-500">
                  Тохирох мөр алга. Шүүлтүүрээ өөрчилнө үү.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <RowDrawer
        open={drawerOpen}
        directive={activeDirective}
        note={activeDirective ? notes[activeDirective.id] ?? "" : ""}
        decision={activeDirective ? decisions[activeDirective.id] : "pending"}
        onDecision={(v) => activeDirective && decide(activeDirective.id, v)}
        onNoteChange={(v) =>
          activeDirective &&
          setNotes((n) => ({ ...n, [activeDirective.id]: v }))
        }
        onClose={() => setDrawerOpen(false)}
      />

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

function SummaryBar({
  report,
  totals,
  decisions,
  onDownload,
}: {
  report: Report;
  totals: { correct: number; wrong: number; pending: number };
  decisions: Record<string, Directive["decision"]>;
  onDownload: () => void;
}) {
  const decided = totals.correct + totals.wrong;
  const pct = Math.round((decided / report.directives.length) * 100);
  return (
    <section className="grid grid-cols-1 gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-[0_20px_45px_-30px_rgba(15,42,99,0.3)] lg:grid-cols-[1fr_auto_auto]">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-parliament-500">
          Тайлан
          <span className="text-ink-500">{report.id}</span>
        </div>
        <h1 className="text-xl font-bold text-parliament-900">
          {report.agency}
        </h1>
        <div className="text-[12.5px] text-ink-500">
          {report.period} · {report.type} · Ирсэн {report.submittedAt}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <MetricBubble label="Нийт мөр" value={report.totalRows} />
        <MetricBubble
          label="Өндөр"
          value={report.flagCounts.HIGH}
          tone="danger"
        />
        <MetricBubble
          label="Дунд"
          value={report.flagCounts.MEDIUM}
          tone="warn"
        />
        <MetricBubble label="Бага" value={report.flagCounts.LOW} />
        <MetricBubble label="Шийдсэн" value={`${pct}%`} tone="good" />
      </div>

      <div className="flex items-center gap-2 self-center">
        <button className="rounded-full border border-parliament-100 px-4 py-2 text-[12px] font-semibold text-parliament-800 transition hover:border-parliament-500">
          Шалгах
        </button>
        <button
          onClick={onDownload}
          className="inline-flex items-center gap-2 rounded-full bg-parliament-800 px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-parliament-700"
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
          Тайлан гаргах (.docx)
        </button>
      </div>
    </section>
  );
}

function MetricBubble({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "warn" | "danger" | "good";
}) {
  const c = {
    neutral: "bg-parliament-50 text-parliament-800",
    warn: "bg-amber-100 text-amber-800",
    danger: "bg-rose-100 text-rose-800",
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

function FilterGroup<T extends string>({
  items,
  active,
  onChange,
}: {
  items: Array<{ key: T; label: string }>;
  active: T;
  onChange: (k: T) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-ink-100 bg-white p-1 shadow-sm">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => onChange(it.key)}
          className={cn(
            "rounded-full px-3 py-1 text-[11.5px] font-semibold transition",
            active === it.key
              ? "bg-parliament-800 text-white"
              : "text-ink-500 hover:text-parliament-900",
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function DecisionButtons({
  value,
  onChange,
}: {
  value: Directive["decision"];
  onChange: (v: Directive["decision"]) => void;
}) {
  return (
    <div
      className="inline-flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => onChange(value === "correct" ? "pending" : "correct")}
        className={cn(
          "rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset transition",
          value === "correct"
            ? "bg-emerald-500 text-white ring-emerald-500"
            : "bg-white text-emerald-700 ring-emerald-200 hover:bg-emerald-50",
        )}
      >
        Зөв
      </button>
      <button
        onClick={() => onChange(value === "wrong" ? "pending" : "wrong")}
        className={cn(
          "rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset transition",
          value === "wrong"
            ? "bg-rose-500 text-white ring-rose-500"
            : "bg-white text-rose-700 ring-rose-200 hover:bg-rose-50",
        )}
      >
        Буруу
      </button>
    </div>
  );
}

function RowDrawer({
  open,
  directive,
  decision,
  note,
  onDecision,
  onNoteChange,
  onClose,
}: {
  open: boolean;
  directive: Directive | null;
  decision: Directive["decision"];
  note: string;
  onDecision: (v: Directive["decision"]) => void;
  onNoteChange: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-parliament-950/40 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-[560px] flex-col bg-white shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {directive ? (
          <>
            <header className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-parliament-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-parliament-800">
                  {directive.code}
                </span>
                <FlagBadge level={directive.flag} />
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full text-ink-500 transition hover:bg-ink-100 hover:text-ink-900"
                aria-label="Хаах"
              >
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                  <path
                    d="m5 5 10 10M15 5 5 15"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </header>

            <div className="scroll-slim flex-1 overflow-y-auto px-6 py-5">
              <h2 className="text-base font-bold text-ink-900">
                {directive.goal}
              </h2>
              <div className="mt-1 text-[12px] text-ink-500">
                {directive.owner} · Хугацаа {directive.deadline}
              </div>

              <section className="mt-5">
                <SectionTitle>Бүтэн биелэлтийн текст</SectionTitle>
                <p className="mt-2 rounded-xl bg-parliament-50/60 p-3 text-[13px] leading-relaxed text-ink-700">
                  {directive.fullText.split(directive.quote).map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 ? (
                        <mark className="rounded bg-gold-400/40 px-0.5 text-parliament-950">
                          {directive.quote}
                        </mark>
                      ) : null}
                    </span>
                  ))}
                </p>
              </section>

              <section className="mt-5">
                <SectionTitle>Тэмдэглэгээний шалтгаан</SectionTitle>
                <ul className="mt-2 space-y-1.5 text-[12.5px] text-ink-700">
                  {directive.reasons.map((r, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-rose-500" />
                      {r}
                    </li>
                  ))}
                </ul>
              </section>

              {directive.concerns.length ? (
                <section className="mt-5">
                  <SectionTitle>Төслийн үеийн санаа зовнил</SectionTitle>
                  <ul className="mt-2 space-y-1.5 text-[12.5px] text-ink-700">
                    {directive.concerns.map((r, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-amber-500" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {directive.evidenceClusters.length ? (
                <section className="mt-5">
                  <SectionTitle>Иргэдийн нотолгооны бүлгүүд</SectionTitle>
                  <div className="mt-2 flex flex-col gap-2">
                    {directive.evidenceClusters.map((c) => (
                      <ClusterCard key={c.id} cluster={c} />
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="mt-5">
                <SectionTitle>Тэмдэглэл</SectionTitle>
                <textarea
                  value={note}
                  onChange={(e) => onNoteChange(e.target.value)}
                  rows={3}
                  placeholder="Шийдвэрийн үндэслэлээ тэмдэглэнэ үү..."
                  className="mt-2 w-full resize-none rounded-lg border border-ink-100 bg-parliament-50/40 px-3 py-2 text-[12.5px] outline-none transition placeholder:text-ink-500/70 focus:border-parliament-500 focus:bg-white"
                />
              </section>
            </div>

            <footer className="flex items-center justify-between border-t border-ink-100 px-6 py-4">
              <div className="flex items-center gap-1.5 text-[11px] text-ink-500">
                <StatusPill
                  tone={
                    decision === "correct"
                      ? "good"
                      : decision === "wrong"
                        ? "danger"
                        : "warn"
                  }
                >
                  {decision === "correct"
                    ? "Зөв"
                    : decision === "wrong"
                      ? "Буруу"
                      : "Хүлээгдэж буй"}
                </StatusPill>
                <Kbd>Y</Kbd> зөв · <Kbd>N</Kbd> буруу
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDecision("wrong")}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-[12px] font-semibold ring-1 ring-inset transition",
                    decision === "wrong"
                      ? "bg-rose-500 text-white ring-rose-500"
                      : "bg-white text-rose-700 ring-rose-200 hover:bg-rose-50",
                  )}
                >
                  Буруу
                </button>
                <button
                  onClick={() => onDecision("correct")}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-[12px] font-semibold ring-1 ring-inset transition",
                    decision === "correct"
                      ? "bg-emerald-500 text-white ring-emerald-500"
                      : "bg-white text-emerald-700 ring-emerald-200 hover:bg-emerald-50",
                  )}
                >
                  Зөв
                </button>
              </div>
            </footer>
          </>
        ) : null}
      </aside>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-parliament-500">
      {children}
    </h3>
  );
}
