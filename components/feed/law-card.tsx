import type { FeedCard } from "@/lib/types";
import { cn } from "@/lib/cn";

// 60 секундийн хуулийн карт.
// Бүтэц: сэдэв → "Одоо / Болох нь" → "Чамд юу гэсэн үг вэ".
// compact=true бол утасны макет дотор багтаах жижиг хувилбар.
export function LawCard({
  card,
  compact = false,
}: {
  card: FeedCard;
  compact?: boolean;
}) {
  const isNew = card.before === null;

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-3xl border border-ink-200 bg-white",
        compact ? "shadow-soft" : "shadow-card",
      )}
    >
      {/* Толгой — сэдэв ба гол асуулт */}
      <div className="bg-brand-50 px-5 pb-4 pt-5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "grid place-items-center rounded-2xl bg-white shadow-soft",
              compact ? "h-9 w-9 text-[18px]" : "h-12 w-12 text-[24px]",
            )}
            aria-hidden
          >
            {card.emoji}
          </span>
          <span className="rounded-full bg-brand-600 px-2.5 py-1 text-[11.5px] font-extrabold uppercase tracking-wide text-white">
            {isNew ? "Шинэ заалт" : "Өөрчлөлт"}
          </span>
        </div>
        <h2
          className={cn(
            "mt-3 font-extrabold leading-[1.15] tracking-tight text-ink-950",
            compact ? "text-[19px]" : "text-[24px] sm:text-[28px]",
          )}
        >
          {card.hook}
        </h2>
      </div>

      {/* Одоо / Болох нь */}
      <div className="flex flex-col gap-2.5 px-5 pt-4">
        {card.before ? (
          <Block
            label="Одоо"
            tone="now"
            text={card.before}
            compact={compact}
          />
        ) : null}
        <Block
          label={isNew ? "Нэмэгдэх нь" : "Болох нь"}
          tone="next"
          text={card.after ?? ""}
          compact={compact}
        />
      </div>

      {/* Чамд юу гэсэн үг вэ */}
      <div className="mt-4 px-5">
        <div className="rounded-2xl bg-point-100 p-4">
          <div className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-point-700">
            Чамд юу гэсэн үг вэ
          </div>
          <p
            className={cn(
              "mt-1.5 font-semibold leading-relaxed text-ink-900",
              compact ? "text-[14px]" : "text-[16px]",
            )}
          >
            {card.youMeaning}
          </p>
        </div>
      </div>

      {/* Эх сурвалж */}
      <div className="mt-auto px-5 pb-4 pt-4">
        <a
          href={card.sourceUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="text-[13px] font-semibold text-ink-600 underline decoration-ink-300 underline-offset-2 hover:text-brand-700"
        >
          Эх сурвалж: lawforum.parliament.mn
        </a>
      </div>
    </article>
  );
}

// "Одоо" (саарал) эсвэл "Болох нь" (ногоон) блок
function Block({
  label,
  tone,
  text,
  compact,
}: {
  label: string;
  tone: "now" | "next";
  text: string;
  compact: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-3.5",
        tone === "now"
          ? "border-ink-200 bg-ink-50"
          : "border-ok-100 bg-ok-50",
      )}
    >
      <div
        className={cn(
          "text-[12px] font-extrabold uppercase tracking-[0.1em]",
          tone === "now" ? "text-ink-600" : "text-ok-800",
        )}
      >
        {label}
      </div>
      <p
        className={cn(
          "mt-1 leading-relaxed text-ink-900",
          compact ? "line-clamp-3 text-[13.5px]" : "text-[15px]",
        )}
      >
        {text}
      </p>
    </div>
  );
}
