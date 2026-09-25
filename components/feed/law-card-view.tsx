"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DiffText } from "@/components/law/diff-text";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { FeedCard } from "@/lib/types";
import { ReadAloud } from "./read-aloud";

// 60 секундийн карт: гарчиг → 1. Одоо ийм байсан → 2. Ийм болно → 3. Чамд ингэж нөлөөлнө.
// Бүх текст урьдчилан бэлдсэн (DB) — AI энд дуудагдахгүй. Өгөгдөлгүй хэсэгт зохиохгүй, үнэнээр бичнэ.

type Step = { title: string; body: React.ReactNode; plain: string; tone?: "impact" };

// «Одоо ийм байсан»: заалтын өмнөх текст, эсвэл төслийн төрлөөс (гарчгаас) гарах баримт
function beforeStep(card: FeedCard): Step {
  const title = "Одоо ийм байсан:";
  if (card.kind === "CHANGE") {
    if (card.before) {
      const parts = card.diff?.filter((p) => !p.added) ?? null;
      return { title, plain: card.before, body: parts ? <DiffText parts={parts} /> : <p>{card.before}</p> };
    }
    const text = "Одоогийн хуульд ийм заалт байхгүй.";
    return { title, plain: text, body: <p>{text}</p> };
  }
  const text =
    card.projectKind === "REVISION"
      ? "Энэ салбарыг одоо хүчин төгөлдөр хууль зохицуулж байна. Төсөл түүнийг бүхэлд нь шинэчлэн найруулна."
      : card.projectKind === "AMENDMENT"
        ? "Одоо хүчин төгөлдөр хууль үйлчилж байна. Төсөл түүнд нэмэлт, өөрчлөлт оруулна."
        : card.projectKind === "NEW"
          ? "Энэ бол анхдагч буюу шинэ хуулийн төсөл."
          : "Одоогийн хуультай заалт бүрээр нь харьцуулаагүй байна.";
  return {
    title,
    plain: text,
    body: (
      <p>
        {text}
        {card.projectId ? <span className="text-muted"> Өмнөх текстийг бүтэн төслөөс харна уу.</span> : null}
      </p>
    ),
  };
}

// «Ийм болно»: шинэ заалт + explainChange-ийн энгийн тайлбар, эсвэл төслөөс яг хуулсан ишлэл
function afterStep(card: FeedCard): Step {
  const title = "Ийм болно:";
  if (card.kind === "CHANGE") {
    const parts = card.diff?.filter((p) => !p.removed) ?? null;
    const lawText = card.after ? (parts ? <DiffText parts={parts} /> : <p>{card.after}</p>) : <p>Энэ заалт хасагдана.</p>;
    return {
      title,
      plain: [card.after ?? "Энэ заалт хасагдана.", card.what ?? ""].join(" ").trim(),
      body: (
        <div className="flex flex-col gap-2">
          {lawText}
          {card.what ? <p className="text-[15px] text-muted">Энгийнээр: {card.what}</p> : null}
        </div>
      ),
    };
  }
  if (card.sourceQuote) {
    return {
      title,
      plain: card.sourceQuote,
      body: (
        <figure>
          <blockquote className="border-l-2 border-line-strong pl-3 italic">«{card.sourceQuote}»</blockquote>
          <figcaption className="mt-1.5 text-[13px] text-muted">Төслийн текстээс</figcaption>
        </figure>
      ),
    };
  }
  return { title, plain: card.hook, body: <p>{card.hook}</p> };
}

export function LawCardView({ card, onStartQuiz }: { card: FeedCard; onStartQuiz: () => void }) {
  const [reading, setReading] = useState<number | null>(null);

  const steps: Step[] = [
    beforeStep(card),
    afterStep(card),
    { title: "Чамд ингэж нөлөөлнө:", plain: card.youMeaning, body: <p className="text-[17px] font-medium text-heading">{card.youMeaning}</p>, tone: "impact" },
  ];
  const category = card.categoryTitle ?? (card.kind === "CHANGE" ? "Заалтын өөрчлөлт" : "Хуулийн төсөл");

  return (
    <article className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="rounded-full bg-surface-2 px-2.5 py-1 font-semibold text-fg">{category}</span>
            {card.projectPublishedAt ? (
              <span className="tabular-nums text-muted">LawForum · {formatDate(new Date(card.projectPublishedAt))}</span>
            ) : null}
          </div>
          <ReadAloud segments={[card.hook, ...steps.map((s) => `${s.title} ${s.plain}`)]} onStep={(i) => setReading(i === null ? null : i - 1)} />
        </div>
        <p className="text-[13.5px] text-muted">
          {card.projectTitle ?? "Хуулийн төсөл"}
          {card.clauseNumber ? ` · ${card.clauseNumber}-р заалт` : ""}
        </p>
        <h2 className={cn("text-[24px] font-bold leading-snug transition-colors sm:text-[28px]", reading === -1 && "rounded-md bg-gold-bg")}>
          {card.hook}
        </h2>
      </header>

      {/* Гурван алхам — дарааллаараа уншина */}
      <ol className="relative flex flex-col gap-3">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className={cn(
              "relative rounded-xl border p-4 pl-14 transition-colors",
              s.tone === "impact" ? "border-good/30 bg-good-bg" : "border-line bg-surface",
              reading === i && "border-gold ring-2 ring-gold/30",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute left-4 top-4 grid h-7 w-7 place-items-center rounded-full text-[13px] font-bold",
                s.tone === "impact" ? "bg-good text-white" : "bg-primary text-on-primary",
              )}
            >
              {i + 1}
            </span>
            <h3 className={cn("font-sans text-[13.5px] font-semibold uppercase tracking-wide", s.tone === "impact" ? "text-good-fg" : "text-muted")}>
              {s.title}
            </h3>
            <div className="mt-1.5 text-[16px] leading-relaxed">{s.body}</div>
          </li>
        ))}
      </ol>

      <footer className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[14px]">
          {card.sourceUrl ? (
            <a href={card.sourceUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-fg underline underline-offset-2">
              Эх сурвалж: LawForum <ExternalLink aria-hidden className="h-3.5 w-3.5" />
            </a>
          ) : null}
          {card.projectId ? (
            <Link
              href={`/bills/${card.projectId}${card.clauseNumber ? `#clause-${card.clauseNumber}` : ""}`}
              className="inline-flex items-center gap-1 text-fg underline underline-offset-2"
            >
              Бүтэн төслийг харах <ArrowRight aria-hidden className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>
        {card.quiz.length > 0 ? (
          <Button onClick={onStartQuiz}>
            <ListChecks aria-hidden className="h-4 w-4" /> Ойлголтоо шалгах ({card.quiz.length})
          </Button>
        ) : null}
      </footer>
    </article>
  );
}
