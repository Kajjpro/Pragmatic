"use client";

import Link from "next/link";
import { DiffText } from "@/components/law/diff-text";
import { ReflectionBadge } from "@/components/feedback/reflection-badge";
import { Pill } from "@/components/ui/pill";
import { EmptyState } from "@/components/ui/empty-state";
import { filterStatusLabels } from "@/lib/labels";
import type { MyComment } from "@/lib/types";

// Таб 1 — "Миний санал": заалт, миний бичсэн текст, шүүлтийн шошго,
// бүлгийн гарчиг, ажилтны хариу, тусгагдсан эсэх, өмнө/дараа.
export function MyComments({ comments }: { comments: MyComment[] }) {
  if (comments.length === 0) {
    return (
      <EmptyState
        emoji="✍️"
        title="Та одоогоор санал өгөөгүй байна"
        description="Заалт дээр саналаа бичвэл ижил санаатай иргэдтэй бүлэглэгдэж, комисс хариу өгнө."
        action={
          <Link
            href="/feed"
            className="press inline-flex min-h-12 items-center rounded-2xl bg-brand-600 px-5 text-[15px] font-extrabold text-white shadow-brand hover:bg-brand-700"
          >
            Хууль үзэх →
          </Link>
        }
      />
    );
  }

  return (
    <ol className="flex flex-col gap-4">
      {comments.map((c) => {
        const replied = Boolean(c.group?.repliedAt);
        return (
          <li
            key={c.id}
            className="rounded-3xl border border-ink-200 bg-white p-5 shadow-card"
          >
            {/* Заалт + хууль */}
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              <Pill tone="brand">{c.clause.number}</Pill>
              <Link
                href={`/bills/${c.clause.billId}`}
                className="min-w-0 flex-1 truncate font-semibold text-brand-700 hover:underline"
              >
                {c.clause.billTitle}
              </Link>
              <time className="shrink-0 tabular-nums text-ink-600">
                {c.createdAt.slice(0, 10)}
              </time>
            </div>

            {/* Миний бичсэн */}
            <blockquote className="mt-3 border-l-4 border-brand-200 pl-3.5 text-[15.5px] leading-relaxed text-ink-900">
              {c.text}
            </blockquote>

            {/* AI-ийн шүүлтийн шошго (хэрэв байвал) */}
            {c.filterStatus && c.filterStatus !== "RELEVANT" ? (
              <p className="mt-2.5 text-[13.5px] font-semibold text-ink-600">
                AI шошго: {filterStatusLabels[c.filterStatus]} — ажилтан сэргээж болно.
              </p>
            ) : null}

            {/* Заалтын өмнө/дараа */}
            {c.clause.diff.length > 0 ? (
              <details className="mt-3 rounded-2xl border border-ink-200 bg-ink-50 p-3.5">
                <summary className="cursor-pointer text-[13.5px] font-extrabold text-ink-700">
                  Заалт хэрхэн өөрчлөгдсөн
                </summary>
                <div className="mt-2.5">
                  <DiffText parts={c.clause.diff} className="text-[15px]" />
                </div>
              </details>
            ) : null}

            {/* Бүлэг + комиссын хариу */}
            {c.group ? (
              <div className="mt-4 rounded-2xl border border-ink-200 bg-brand-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <ReflectionBadge value={replied ? c.group.reflection : "PENDING"} />
                  <span className="text-[12.5px] font-extrabold uppercase tracking-wide text-brand-700">
                    Иргэдийн бүлэг
                  </span>
                </div>
                <p className="mt-2 text-[15px] font-extrabold text-ink-950">
                  {c.group.title}
                </p>
                {c.group.summary ? (
                  <p className="mt-1 text-[14px] leading-relaxed text-ink-700">
                    {c.group.summary}
                  </p>
                ) : null}

                {replied && c.group.replyText ? (
                  <div className="mt-3 rounded-xl border-l-4 border-ok-500 bg-ok-50 p-3 text-[14.5px] leading-relaxed text-ok-800">
                    <div className="mb-1 text-[12px] font-extrabold uppercase tracking-wide">
                      Комиссын хариу
                    </div>
                    {c.group.replyText}
                  </div>
                ) : (
                  <p className="mt-3 text-[13.5px] font-semibold text-ink-600">
                    ⏳ Комиссын хариу хүлээгдэж байна
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-4 rounded-2xl border border-dashed border-ink-200 bg-ink-50 p-3 text-[13.5px] font-semibold text-ink-600">
                ⏳ Ижил санаатай иргэдтэй бүлэглэгдэхийг хүлээж байна
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
