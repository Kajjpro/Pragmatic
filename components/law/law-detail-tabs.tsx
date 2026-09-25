"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { Law, Directive } from "@/lib/stub/types";
import { ClauseCard } from "./clause-card";
import { VoteResultBar } from "./vote-result-bar";
import { DirectiveCard } from "@/components/monitoring/directive-card";
import { EmptyState } from "@/components/ui/empty-state";

const tabs = [
  { key: "overview", label: "Тойм" },
  { key: "clauses", label: "Заалтууд" },
  { key: "vote", label: "Санал хураалт" },
  { key: "impl", label: "Хэрэгжилт" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export function LawDetailTabs({
  law,
  directives,
}: {
  law: Law;
  directives: Directive[];
}) {
  const [active, setActive] = useState<TabKey>("overview");
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1 border-b border-ink-100">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={cn(
              "relative -mb-px px-4 py-2.5 text-[13px] font-semibold transition-colors",
              active === t.key
                ? "text-parliament-900"
                : "text-ink-500 hover:text-parliament-800",
            )}
          >
            {t.label}
            {active === t.key ? (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-parliament-800" />
            ) : null}
          </button>
        ))}
      </div>

      <div className="animate-fade-in">
        {active === "overview" ? <OverviewTab law={law} /> : null}
        {active === "clauses" ? <ClausesTab law={law} /> : null}
        {active === "vote" ? <VoteTab law={law} /> : null}
        {active === "impl" ? <ImplTab directives={directives} /> : null}
      </div>
    </div>
  );
}

function OverviewTab({ law }: { law: Law }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="rounded-2xl border border-ink-100 bg-white p-5 lg:col-span-2">
        <h3 className="text-sm font-semibold text-parliament-900">Танилцуулга</h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-700">
          {law.summary}
        </p>
        <h4 className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-parliament-500">
          Гол цэгүүд
        </h4>
        <ul className="mt-2 space-y-1.5 text-[13px] text-ink-700">
          {law.keyPoints.map((k, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-parliament-500" />
              {k}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-ink-100 bg-white p-5">
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-parliament-500">
          Хамрах хүрээ
        </h4>
        <ul className="mt-3 space-y-2">
          {law.affected.map((a) => (
            <li
              key={a}
              className="flex items-center gap-2 rounded-lg bg-parliament-50/60 px-3 py-2 text-[12.5px] text-parliament-900"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-parliament-700 ring-1 ring-parliament-100">
                <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3">
                  <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M4 17c1-3 4-4 6-4s5 1 6 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
              {a}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ClausesTab({ law }: { law: Law }) {
  if (!law.clauses.length) {
    return (
      <EmptyState
        title="Заалт хараахан оруулаагүй байна"
        description="Хуулийн текст оруулагдаагүй тул иргэдийн санал энд тусгагдаагүй байна."
      />
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {law.clauses.map((c) => (
        <ClauseCard key={c.id} clause={c} />
      ))}
    </div>
  );
}

function VoteTab({ law }: { law: Law }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-ink-100 bg-white p-5">
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-parliament-500">
          УИХ-ын гишүүдийн санал
        </h4>
        <div className="mt-3">
          <VoteResultBar
            support={law.vote.support}
            oppose={law.vote.oppose}
            neutral={law.vote.neutral}
            total={law.vote.total || 1}
          />
        </div>
        <div className="mt-2 text-[11.5px] text-ink-500">
          Нийт саналын хуудас: {law.vote.total}
        </div>
      </div>
      <div className="rounded-2xl border border-ink-100 bg-white p-5">
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-parliament-500">
          Энэ сайтад санал өгсөн иргэдийн дунд
        </h4>
        <div className="mt-3">
          <VoteResultBar
            support={law.siteVote.support}
            oppose={law.siteVote.oppose}
            neutral={law.siteVote.neutral}
            total={law.siteVote.total || 1}
          />
        </div>
        <div className="mt-2 text-[11.5px] text-ink-500">
          Нийт оролцогч: {law.siteVote.total.toLocaleString("mn-MN")} · Тайлбар
          зөвхөн бүртгэлтэй иргэдийн хариу.
        </div>
      </div>
    </div>
  );
}

function ImplTab({ directives }: { directives: Directive[] }) {
  if (!directives.length) {
    return (
      <EmptyState
        title="Хэрэгжилтийн үүрэг хуваарилагдаагүй"
        description="Хууль хүчин төгөлдөр болсны дараа зорилтууд энд харагдана."
      />
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {directives.map((d) => (
        <DirectiveCard key={d.id} directive={d} />
      ))}
    </div>
  );
}
