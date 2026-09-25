"use client";

import { useMemo } from "react";
import type { FeedCard as Card } from "@/lib/types";
import { compareWords } from "@/lib/law/compare";
import { DiffText } from "@/components/law/diff-text";

// Нэг бүтэн дэлгэцийн хуулийн карт.
// Урт хууль багтахгүй бол дотроо гүйлгэнэ (гадна талын свайп ажилласаар байна).
export function FeedCard({
  card,
  onOpenQuiz,
}: {
  card: Card;
  onOpenQuiz: () => void;
}) {
  const isNew = card.before === null;

  // Өөрчлөгдсөн үгсийг ялгах — Dev 1-ийн compareWords-ыг дахин ашиглав
  const diff = useMemo(
    () => (isNew ? [] : compareWords(card.before, card.after)),
    [card.before, card.after, isNew],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-card">
      {/* Гүйлгэх хэсэг */}
      <div
        data-card-scroll
        className="scroll-slim min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {/* Сэдэв */}
        <div className="bg-brand-50 px-5 pb-5 pt-5">
          <div className="flex items-center gap-2.5">
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-[24px] shadow-soft"
              aria-hidden
            >
              {card.emoji}
            </span>
            <span className="rounded-full bg-brand-600 px-2.5 py-1 text-[11.5px] font-extrabold uppercase tracking-wide text-white">
              {isNew ? "Шинэ заалт" : "Өөрчлөлт"}
            </span>
          </div>
          <h2 className="mt-3.5 text-[26px] font-extrabold leading-[1.13] tracking-tight text-ink-950 sm:text-[30px]">
            {card.hook}
          </h2>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5">
          {/* Одоо → Болох нь (өөрчлөгдсөн үг тодруулсан) */}
          {isNew ? (
            <section className="rounded-2xl border border-ok-100 bg-ok-50 p-4">
              <h3 className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-ok-800">
                Нэмэгдэх заалт
              </h3>
              <p className="mt-1.5 text-[15.5px] leading-relaxed text-ink-900">
                {card.after}
              </p>
            </section>
          ) : (
            <section className="rounded-2xl border border-ink-200 bg-ink-50 p-4">
              <h3 className="flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-[0.1em] text-ink-600">
                Одоо <span aria-hidden>→</span> Болох нь
              </h3>
              <div className="mt-2">
                <DiffText parts={diff} className="text-[15.5px]" />
              </div>
              {/* Өнгөний тайлбар — өнгө ганцаараа мэдээлэл дамжуулахгүй байх */}
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] font-semibold text-ink-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-bad-100 ring-1 ring-bad-600/40" />
                  хасагдсан
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-ok-100 ring-1 ring-ok-700/40" />
                  нэмэгдсэн
                </span>
              </p>
            </section>
          )}

          {/* Чамд юу гэсэн үг вэ */}
          <section className="rounded-2xl bg-point-100 p-4">
            <h3 className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-point-700">
              Чамд юу гэсэн үг вэ
            </h3>
            <p className="mt-1.5 text-[16.5px] font-semibold leading-relaxed text-ink-900">
              {card.youMeaning}
            </p>
          </section>

          <a
            href={card.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-[13.5px] font-semibold text-ink-600 underline decoration-ink-300 underline-offset-2 hover:text-brand-700"
          >
            Эх сурвалж: lawforum.parliament.mn
          </a>
        </div>
      </div>

      {/* Доод товч — үргэлж харагдана */}
      <div className="shrink-0 border-t border-ink-100 bg-white p-3.5">
        <button
          type="button"
          onClick={onOpenQuiz}
          className="press min-h-14 w-full rounded-2xl bg-brand-600 text-[16.5px] font-extrabold text-white shadow-brand hover:bg-brand-700"
        >
          {card.quiz.length} асуулт →
        </button>
      </div>
    </div>
  );
}
