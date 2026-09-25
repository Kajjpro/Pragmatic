"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { Law, Directive } from "@/lib/stub/types";
import { LawCard } from "@/components/law/law-card";
import { DirectiveCard } from "@/components/monitoring/directive-card";

type Tab = "debate" | "impl";
const tabs: Array<{ key: Tab; label: string; hint: string }> = [
  {
    key: "debate",
    label: "Хэлэлцэгдэж буй төсөл",
    hint: "Санал нэмэрлэх боломжтой хууль, шинэчилсэн найруулгууд",
  },
  {
    key: "impl",
    label: "Хэрэгжилтийн хяналт",
    hint: "Батлагдсан хуулиудын хэрэгжилтийн зорилтууд",
  },
];

export function LawsExplorer({
  laws,
  directives,
}: {
  laws: Law[];
  directives: Directive[];
}) {
  const [tab, setTab] = useState<Tab>("debate");
  const [category, setCategory] = useState<string>("Бүгд");

  const categories = useMemo(() => {
    const set = new Set<string>(laws.map((l) => l.category));
    return ["Бүгд", ...Array.from(set)];
  }, [laws]);

  const filteredLaws = useMemo(() => {
    return laws.filter((l) => {
      if (tab === "debate") return l.stage === "debate" || l.stage === "draft";
      return l.stage === "implementation" || l.stage === "passed";
    }).filter((l) => (category === "Бүгд" ? true : l.category === category));
  }, [laws, tab, category]);

  const top = [...laws]
    .sort((a, b) => b.followers - a.followers)
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between border-b border-ink-100 pb-3">
        <div className="flex items-end gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "relative -mb-3 flex flex-col items-start px-4 pb-3 text-left transition",
                tab === t.key ? "text-parliament-900" : "text-ink-500 hover:text-parliament-800",
              )}
            >
              <span className="text-[13.5px] font-bold">{t.label}</span>
              <span className="text-[11px] font-normal text-ink-500">
                {t.hint}
              </span>
              {tab === t.key ? (
                <span className="absolute inset-x-3 -bottom-px h-[3px] rounded-full bg-parliament-800" />
              ) : null}
            </button>
          ))}
        </div>
        <div className="hidden items-center gap-1.5 md:flex">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full border px-3 py-1 text-[11px] font-semibold transition",
                category === c
                  ? "border-parliament-800 bg-parliament-800 text-white"
                  : "border-ink-100 bg-white text-ink-500 hover:border-parliament-500 hover:text-parliament-800",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {tab === "debate"
            ? filteredLaws.map((l) => <LawCard key={l.id} law={l} />)
            : directives.map((d) => (
                <DirectiveCard key={d.id} directive={d} />
              ))}
        </div>

        <aside className="rounded-2xl border border-ink-100 bg-white p-5 shadow-[0_20px_45px_-30px_rgba(15,42,99,0.3)]">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-gold-400 text-parliament-950">
              <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3">
                <path
                  d="M10 3 12 8h5l-4 3 1.5 5-4.5-3-4.5 3L7 11 3 8h5Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <h3 className="text-[13px] font-semibold text-parliament-900">
              Хамгийн их хэлэлцэгдэж буй
            </h3>
          </div>
          <p className="mt-0.5 text-[11px] text-ink-500">
            lawforum.mn статистикаар
          </p>
          <ol className="mt-4 flex flex-col gap-3">
            {top.map((l, i) => (
              <li key={l.id} className="flex items-start gap-3">
                <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-parliament-800 text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <div className="text-[12.5px] font-semibold leading-snug text-ink-900">
                    {l.title}
                  </div>
                  <div className="mt-0.5 text-[11px] text-ink-500">
                    {l.followers.toLocaleString("mn-MN")} дагагч ·{" "}
                    {l.category}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
