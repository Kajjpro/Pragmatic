"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { RegistryItem, RegistryStatus } from "@/lib/stub/registry";
import { StatusPill } from "@/components/ui/status-pill";

const tabs: Array<{ key: RegistryStatus; label: string; hint: string }> = [
  { key: "proposed", label: "Хяналтад авах санал", hint: "AI санамж" },
  { key: "watching", label: "Хяналтад байгаа", hint: "Тогтмол дагаж буй" },
  { key: "removal", label: "Хасах санал", hint: "Хүлээж буй шийдвэр" },
];

type Decision = "approved" | "edited" | "rejected" | null;

export function RegistryBoard({ items }: { items: RegistryItem[] }) {
  const [tab, setTab] = useState<RegistryStatus>("proposed");
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});

  const filtered = useMemo(
    () => items.filter((i) => i.status === tab),
    [items, tab],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between border-b border-ink-100 pb-2">
        <div className="flex items-end gap-1">
          {tabs.map((t) => {
            const count = items.filter((i) => i.status === t.key).length;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "relative -mb-2 flex flex-col items-start px-4 pb-2.5 text-left transition",
                  tab === t.key
                    ? "text-parliament-900"
                    : "text-ink-500 hover:text-parliament-800",
                )}
              >
                <span className="flex items-center gap-2 text-[13px] font-bold">
                  {t.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-px text-[10px] font-bold",
                      tab === t.key
                        ? "bg-parliament-800 text-white"
                        : "bg-ink-100 text-ink-500",
                    )}
                  >
                    {count}
                  </span>
                </span>
                <span className="text-[11px] font-normal text-ink-500">
                  {t.hint}
                </span>
                {tab === t.key ? (
                  <span className="absolute inset-x-3 -bottom-px h-[3px] rounded-full bg-parliament-800" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-100 bg-white p-10 text-center text-[13px] text-ink-500">
          Одоогоор энд юу ч алга.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((item) => {
            const d = decisions[item.id] ?? null;
            return (
              <article
                key={item.id}
                className="group rounded-2xl border border-ink-100 bg-white p-5 shadow-[0_20px_45px_-30px_rgba(15,42,99,0.25)] transition hover:-translate-y-0.5 hover:border-parliament-200 hover:shadow-[0_25px_55px_-30px_rgba(15,42,99,0.4)] animate-rise"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-parliament-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-parliament-800">
                        {item.code}
                      </span>
                      <span className="text-[11.5px] text-ink-500">
                        Санал болгосон: {item.proposer} · {item.submittedAt}
                      </span>
                      {d === "approved" ? (
                        <StatusPill tone="good">Батлагдсан</StatusPill>
                      ) : d === "rejected" ? (
                        <StatusPill tone="danger">Татгалзсан</StatusPill>
                      ) : d === "edited" ? (
                        <StatusPill tone="warn">Засах явцад</StatusPill>
                      ) : null}
                    </div>
                    <h3 className="mt-2 text-[15px] font-semibold text-ink-900">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[12.5px] text-ink-500">
                      {item.reason}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        setDecisions((s) => ({
                          ...s,
                          [item.id]: s[item.id] === "rejected" ? null : "rejected",
                        }))
                      }
                      className={cn(
                        "rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset transition",
                        d === "rejected"
                          ? "bg-rose-500 text-white ring-rose-500"
                          : "bg-white text-rose-700 ring-rose-200 hover:bg-rose-50",
                      )}
                    >
                      Татгалзах
                    </button>
                    <button
                      onClick={() =>
                        setDecisions((s) => ({
                          ...s,
                          [item.id]: s[item.id] === "edited" ? null : "edited",
                        }))
                      }
                      className={cn(
                        "rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset transition",
                        d === "edited"
                          ? "bg-amber-500 text-white ring-amber-500"
                          : "bg-white text-amber-700 ring-amber-200 hover:bg-amber-50",
                      )}
                    >
                      Засах
                    </button>
                    <button
                      onClick={() =>
                        setDecisions((s) => ({
                          ...s,
                          [item.id]: s[item.id] === "approved" ? null : "approved",
                        }))
                      }
                      className={cn(
                        "rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset transition",
                        d === "approved"
                          ? "bg-emerald-500 text-white ring-emerald-500"
                          : "bg-white text-emerald-700 ring-emerald-200 hover:bg-emerald-50",
                      )}
                    >
                      Батлах
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 rounded-xl bg-parliament-50/60 p-3 sm:grid-cols-[auto_1fr]">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wider text-parliament-700">
                    Эх ишлэл
                  </div>
                  <div className="text-[12.5px] italic leading-relaxed text-parliament-900">
                    «{item.sourceQuote}»
                    <div className="mt-1 text-[11px] font-normal not-italic text-ink-500">
                      Эх сурвалж: {item.sourceRef}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
