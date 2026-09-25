import Link from "next/link";
import { Award, MessageSquare } from "lucide-react";
import { DiffText } from "@/components/law/diff-text";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";
import { filterStatusLabels } from "@/lib/labels";
import type { Badge, MyComment } from "@/lib/types";
import { cn } from "@/lib/cn";
import { ImpactStepper, impactStage } from "./impact-stepper";

// "Миний санал": заалт, миний текст, 3 шаттай явц, ажлын албаны хариу, тусгагдсан бол батламж.
export function MyComments({
  comments,
  badges,
  onPropose,
}: {
  comments: MyComment[];
  badges: Badge[];
  onPropose?: () => void;
}) {
  if (comments.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Та одоогоор санал ирүүлээгүй байна"
        description="Хуулийн төслийн заалтад саналаа ирүүлээрэй. Ажлын алба ижил санааг бүлэглэн хариулж, тусгасан эсэхийг энд харуулна."
        action={
          onPropose ? (
            <button type="button" onClick={onPropose} className={buttonClass("primary")}>
              Санал ирүүлэх
            </button>
          ) : (
            <Link href="/bills" className={buttonClass("primary")}>
              Хуулийн төслүүд
            </Link>
          )
        }
      />
    );
  }

  const badgeByComment = new Map(badges.filter((b) => b.commentId).map((b) => [b.commentId as string, b]));

  return (
    <ol className="flex flex-col gap-4">
      {comments.map((c) => {
        const { outcome } = impactStage(c);
        const badge = badgeByComment.get(c.id);
        const replied = Boolean(c.group?.repliedAt);
        return (
          <li
            key={c.id}
            className={cn(
              "rounded-2xl border bg-surface p-5 shadow-card sm:p-6",
              outcome === "REFLECTED" ? "border-good/40" : "border-line",
            )}
          >
            <Link href={`/bills/${c.clause.billId}#clause-${c.clause.number}`} className="text-[14px] font-medium text-muted hover:text-fg hover:underline">
              {c.clause.billTitle} · {c.clause.number}-р заалт
            </Link>
            <blockquote className="mt-2 text-[16.5px] leading-relaxed text-fg">«{c.text}»</blockquote>

            <div className="mt-5">
              <ImpactStepper comment={c} />
            </div>

            {c.filterStatus && c.filterStatus !== "RELEVANT" ? (
              <p className="mt-4 rounded-lg bg-surface-2 px-3 py-2 text-[13.5px] text-muted">
                Шүүлтийн шошго: {filterStatusLabels[c.filterStatus]}. Санал устгагдаагүй; ажилтан сэргээж болно.
              </p>
            ) : null}

            {c.group && replied && c.group.replyText ? (
              <div className="mt-4 rounded-xl border border-line bg-page px-4 py-3">
                <p className="text-[13px] font-semibold text-muted">Ажлын албаны хариу · {c.group.title}</p>
                <p className="mt-1 text-[15px]">{c.group.replyText}</p>
              </div>
            ) : (
              <p className="mt-4 text-[14px] text-muted">
                {c.group
                  ? `Таны санал «${c.group.title}» бүлэгт орсон. Ажлын албаны хариу хүлээгдэж байна.`
                  : "Ижил санаатай саналуудтай бүлэглэгдэхийг хүлээж байна."}
              </p>
            )}

            {outcome === "REFLECTED" ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-good-bg px-4 py-3">
                <p className="flex items-center gap-2 font-semibold text-good-fg">
                  <Award aria-hidden className="h-5 w-5" /> Таны санал тусгагдлаа — Хууль өөрчилсөн иргэн
                </p>
                {badge ? (
                  <Link href={`/b/${badge.id}`} className={buttonClass("primary", "sm")}>
                    Батламж харах
                  </Link>
                ) : null}
              </div>
            ) : null}

            {c.clause.diff.length > 0 ? (
              <details className="mt-4 border-t border-line pt-3">
                <summary className="cursor-pointer text-[14.5px] font-medium text-fg underline underline-offset-2">Заалт хэрхэн өөрчлөгдөх вэ</summary>
                <DiffText parts={c.clause.diff} className="mt-2 text-[15px]" />
              </details>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
