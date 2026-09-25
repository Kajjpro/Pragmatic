"use client";

import Link from "next/link";
import { Pill } from "@/components/ui/pill";
import { EmptyState } from "@/components/ui/empty-state";
import type { MeData } from "@/lib/types";

type Row = NonNullable<MeData["predictions"]>[number];

// Таб 2 — "Таамгууд": үйл явдал, миний таамаг, дүн, оноо.
export function MyPredictions({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        emoji="🎯"
        title="Та одоогоор таамаг өгөөгүй байна"
        description="Санал хураалт дэмжигдэх эсэхийг таавал дүн гармагц оноо нэмэгдэнэ."
        action={
          <Link
            href="/predict"
            className="press inline-flex min-h-12 items-center rounded-2xl bg-brand-600 px-5 text-[15px] font-extrabold text-white shadow-brand hover:bg-brand-700"
          >
            Таамаглах →
          </Link>
        }
      />
    );
  }

  return (
    <ol className="flex flex-col gap-4">
      {rows.map((p) => {
        const e = p.event;
        const revealed = e.status === "REVEALED";
        return (
          <li
            key={p.voteEventId}
            className="rounded-3xl border border-ink-200 bg-white p-5 shadow-card"
          >
            <div className="flex flex-wrap items-center gap-2">
              {revealed ? <Pill tone="ok">Дүн гарсан</Pill> : <Pill tone="brand">Хүлээгдэж буй</Pill>}
              {e.isReplay ? <Pill tone="neutral">Дахин тоглох</Pill> : null}
            </div>

            <h3 className="mt-2.5 text-[17px] font-extrabold leading-snug text-ink-950">
              {e.hook}
            </h3>
            <p className="mt-1 text-[14px] leading-relaxed text-ink-600">{e.title}</p>

            <div className="mt-3.5 grid grid-cols-2 gap-2.5 text-center">
              <div className="rounded-2xl bg-ink-50 p-3">
                <div className="text-[12px] font-extrabold uppercase tracking-wide text-ink-600">
                  Чиний таамаг
                </div>
                <div className="mt-0.5 text-[22px] font-extrabold tabular-nums text-ink-950">
                  {p.supportGuess}
                </div>
                <div className="text-[12.5px] font-semibold text-ink-600">
                  {p.willPass ? "Дэмжигдэнэ" : "Дэмжигдэхгүй"}
                </div>
              </div>

              <div className="rounded-2xl bg-brand-50 p-3">
                <div className="text-[12px] font-extrabold uppercase tracking-wide text-brand-700">
                  Бодит
                </div>
                <div className="mt-0.5 text-[22px] font-extrabold tabular-nums text-brand-700">
                  {revealed && e.actualSupport !== null ? e.actualSupport : "—"}
                </div>
                <div className="text-[12.5px] font-semibold text-ink-600">
                  {revealed ? (e.passed ? "Батлагдсан" : "Батлагдаагүй") : "Хүлээгдэж буй"}
                </div>
              </div>
            </div>

            {revealed ? (
              <p
                className={
                  p.points > 0
                    ? "mt-3 rounded-2xl bg-point-100 p-3 text-center text-[15.5px] font-extrabold text-point-700"
                    : "mt-3 text-center text-[14px] font-semibold text-ink-600"
                }
              >
                {p.points > 0 ? `+${p.points} оноо` : "Энэ удаад оноо нэмэгдсэнгүй"}
              </p>
            ) : (
              <p className="mt-3 text-center text-[14px] font-semibold text-ink-600">
                Дүн гарахад мэдэгдэнэ
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
