"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Law, Directive } from "@/lib/stub/types";
import { LawCard } from "@/components/law/law-card";
import { DirectiveCard } from "@/components/monitoring/directive-card";

type Tab = "debate" | "impl";
const tabs: Array<{ key: Tab; label: string }> = [
  { key: "debate", label: "Хэлэлцэгдэж буй төсөл" },
  { key: "impl", label: "Хэрэгжилтийн хяналт" },
];

const MAX_ITEMS = 3;

export function LawsExplorer({
  laws,
  directives,
}: {
  laws: Law[];
  directives: Directive[];
}) {
  const [tab, setTab] = useState<Tab>("debate");

  const filteredLaws = useMemo(
    () =>
      laws.filter((l) =>
        tab === "debate"
          ? l.stage === "debate" || l.stage === "draft"
          : l.stage === "implementation" || l.stage === "passed",
      ),
    [laws, tab],
  );

  const items =
    tab === "debate" ? filteredLaws.slice(0, MAX_ITEMS) : directives.slice(0, MAX_ITEMS);

  const totalCount =
    tab === "debate" ? filteredLaws.length : directives.length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink-100 pb-3">
        <div className="flex items-end gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "relative -mb-3 px-4 pb-3 text-left text-[13.5px] font-bold transition",
                tab === t.key
                  ? "text-parliament-700"
                  : "text-ink-500 hover:text-parliament-700",
              )}
            >
              {t.label}
              {tab === t.key ? (
                <span className="absolute inset-x-3 -bottom-px h-[3px] rounded-full bg-parliament-700" />
              ) : null}
            </button>
          ))}
        </div>
        <Link
          href="/"
          className="text-[11.5px] font-semibold text-parliament-700 hover:text-parliament-900"
        >
          Бүгд ({totalCount}) →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {tab === "debate"
          ? (items as Law[]).map((l) => <LawCard key={l.id} law={l} />)
          : (items as Directive[]).map((d) => (
              <DirectiveCard key={d.id} directive={d} />
            ))}
      </div>
    </div>
  );
}
