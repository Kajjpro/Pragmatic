import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DiffText } from "@/components/law/diff-text";
import type { FeedCard } from "@/lib/types";

// Нэг карт: хууль + заалт → "Одоо ийм байна" / "Ийм болно" → "Танд хамаарах нь" → эх сурвалж → шалгах
export function LawCardView({ card, onStartQuiz }: { card: FeedCard; onStartQuiz: () => void }) {
  const before = card.diff?.filter((p) => !p.added) ?? null;
  const after = card.diff?.filter((p) => !p.removed) ?? null;
  const hasCompare = Boolean(card.before || card.after);

  return (
    <article className="flex flex-col gap-5">
      <header>
        <p className="text-[14px] text-muted">
          {card.projectTitle ?? "Хуулийн төсөл"}
          {card.clauseNumber ? ` · ${card.clauseNumber}-р заалт` : ""}
        </p>
        <h2 className="mt-1.5 text-[23px] font-bold leading-snug sm:text-[26px]">{card.hook}</h2>
      </header>

      {hasCompare ? (
        <div className="grid gap-3 md:grid-cols-2">
          <section className="rounded-md border border-line p-4">
            <h3 className="font-sans text-[13px] font-semibold uppercase tracking-wide text-muted">Одоо ийм байна</h3>
            {card.before ? (
              before ? <DiffText parts={before} className="mt-2" /> : <p className="mt-2">{card.before}</p>
            ) : (
              <p className="mt-2 italic text-muted">Одоогийн хуульд ийм заалт байхгүй.</p>
            )}
          </section>
          <section className="rounded-md border border-line p-4">
            <h3 className="font-sans text-[13px] font-semibold uppercase tracking-wide text-muted">Ийм болно</h3>
            {card.after ? (
              after ? <DiffText parts={after} className="mt-2" /> : <p className="mt-2">{card.after}</p>
            ) : (
              <p className="mt-2 italic text-muted">Энэ заалт хасагдана.</p>
            )}
          </section>
        </div>
      ) : null}

      <section className="rounded-md border-l-2 border-primary bg-surface-2 px-4 py-3">
        <h3 className="font-sans text-[14px] font-semibold text-heading">Танд хамаарах нь</h3>
        <p className="mt-1 text-[16px]">{card.youMeaning}</p>
      </section>

      <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[14px]">
          {card.sourceUrl ? (
            <a href={card.sourceUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-action underline underline-offset-2">
              Эх сурвалж: LawForum <ExternalLink aria-hidden className="h-3.5 w-3.5" />
            </a>
          ) : null}
          {card.projectId ? (
            <Link
              href={`/bills/${card.projectId}${card.clauseNumber ? `#clause-${card.clauseNumber}` : ""}`}
              className="inline-flex items-center gap-1 text-action underline underline-offset-2"
            >
              Бүтэн харьцуулалтыг харах <ArrowRight aria-hidden className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>
        {card.quiz.length > 0 ? (
          <Button onClick={onStartQuiz}>Ойлголтоо шалгах ({card.quiz.length} асуулт)</Button>
        ) : null}
      </div>
    </article>
  );
}
