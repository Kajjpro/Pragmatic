"use client";

import { useState } from "react";
import Link from "next/link";
import type { Law, Directive } from "@/lib/stub/types";
import { SearchBar } from "@/components/site/search-bar";
import { HeroCard } from "@/components/home/hero-card";
import { SessionPanel } from "@/components/home/session-panel";
import { LawsExplorer } from "@/components/home/laws-explorer";
import { SiteFooter } from "@/components/site/site-footer";

export function HomeShell({
  laws,
  directives,
}: {
  laws: Law[];
  directives: Directive[];
}) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filteredLaws = q
    ? laws.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.summary.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q),
      )
    : laws;
  const filteredDirectives = q
    ? directives.filter(
        (d) =>
          d.goal.toLowerCase().includes(q) ||
          d.code.toLowerCase().includes(q) ||
          d.owner.toLowerCase().includes(q),
      )
    : directives;

  return (
    <div className="flex flex-col">
      <SearchBar value={query} onChange={setQuery} />

      <section className="bg-white pt-6">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <HeroCard />
          <SessionPanel />
        </div>
      </section>

      <section className="bg-parliament-50/40 pb-16 pt-12">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-editorial text-2xl font-medium text-parliament-900">
                Хууль тогтоомж
              </h2>
              <p className="mt-0.5 text-[12.5px] text-ink-500">
                {q ? (
                  <>
                    «<span className="font-semibold text-parliament-700">{query}</span>» — {filteredLaws.length} хууль · {filteredDirectives.length} зорилт
                  </>
                ) : (
                  <>Санал өг · Дагах · Хэрэгжилтийг хян</>
                )}
              </p>
            </div>
            <Link
              href="/me"
              className="text-[11.5px] font-semibold text-parliament-700 hover:text-parliament-900"
            >
              Миний оролцоо →
            </Link>
          </div>
          <LawsExplorer laws={filteredLaws} directives={filteredDirectives} />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
