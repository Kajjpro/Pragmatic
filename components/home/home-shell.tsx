"use client";

import { useState } from "react";
import type { Law, Directive } from "@/lib/stub/types";
import { SearchBar } from "@/components/site/search-bar";
import { CategoryPills } from "@/components/site/category-pills";
import { HeroCard } from "@/components/home/hero-card";
import { SessionPanel } from "@/components/home/session-panel";
import { LawsExplorer } from "@/components/home/laws-explorer";
import { ImpactStrip } from "@/components/home/impact-strip";
import { SiteFooter } from "@/components/site/site-footer";
import Link from "next/link";

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

      <section className="bg-white pt-5">
        <CategoryPills />
      </section>

      <section className="bg-white pt-6">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <HeroCard />
          <SessionPanel />
        </div>
      </section>

      <ImpactStrip />

      <section className="bg-parliament-50/40 pb-16 pt-12">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-parliament-500">
                Иргэдийн платформ
              </div>
              <h2 className="mt-1 text-2xl font-bold text-parliament-900">
                Хууль тогтоомжийн урсгал
              </h2>
              <p className="mt-1 text-[13px] text-ink-500">
                {q ? (
                  <>
                    «<span className="font-semibold text-parliament-800">{query}</span>» — {filteredLaws.length} хууль ·{" "}
                    {filteredDirectives.length} зорилт олдсон
                  </>
                ) : (
                  <>Санал өгөх, дагах, хэрэгжилтийг хянах — нэг цонхны шийдэл.</>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/me"
                className="rounded-full border border-parliament-100 bg-white px-4 py-2 text-[12px] font-semibold text-parliament-800 shadow-sm transition hover:border-parliament-500"
              >
                Миний оролцоо →
              </Link>
              <Link
                href="/staff"
                className="hidden items-center gap-2 rounded-full bg-parliament-800 px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-parliament-700 md:inline-flex"
              >
                Ажилтны булан →
              </Link>
            </div>
          </div>
          <LawsExplorer laws={filteredLaws} directives={filteredDirectives} />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
