import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { DiffText } from "@/components/law/diff-text";
import { ReflectionBadge } from "@/components/feedback/reflection-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";
import { filterStatusLabels } from "@/lib/labels";
import type { MyComment } from "@/lib/types";
import { formatShortDate } from "@/lib/format";


// "Миний санал": заалт, миний текст, төлөв (Тусгасан/Тусгаагүй/Хүлээгдэж буй), ажлын албаны хариу, өмнө/дараа.
export function MyComments({ comments }: { comments: MyComment[] }) {
  if (comments.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Та одоогоор санал өгөөгүй байна"
        description="Хуулийн өөрчлөлтийн заалт бүрийн доор санал бичих боломжтой. Ажлын алба ижил санааг бүлэглэн хариулна."
        action={
          <Link href="/bills" className={buttonClass("primary")}>
            Хуулийн өөрчлөлтүүд
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
          <li key={c.id} className="rounded-lg border border-line bg-surface p-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-muted">
              <Link href={`/bills/${c.clause.billId}#clause-${c.clause.number}`} className="font-medium text-action hover:underline">
                {c.clause.billTitle}, {c.clause.number}-р заалт
              </Link>
              <time dateTime={c.createdAt} className="tabular-nums">
                {formatShortDate(new Date(c.createdAt))}
              </time>
            </div>

            <blockquote className="mt-3 border-l-2 border-line-strong pl-3 text-[16px]">{c.text}</blockquote>

            {c.filterStatus && c.filterStatus !== "RELEVANT" ? (
              <p className="mt-2 text-[14px] text-muted">
                Шүүлтийн шошго: {filterStatusLabels[c.filterStatus]}. Санал устгагдаагүй; ажилтан сэргээж болно.
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[14px] text-muted">Төлөв:</span>
              <ReflectionBadge value={replied && c.group ? c.group.reflection : "PENDING"} />
            </div>

            {c.group && replied && c.group.replyText ? (
              <blockquote className="mt-3 border-l-2 border-action pl-3 text-[15px]">
                <span className="block text-[13px] font-semibold text-muted">Ажлын албаны хариу · {c.group.title}</span>
                {c.group.replyText}
              </blockquote>
            ) : (
              <p className="mt-2 text-[14px] text-muted">
                {c.group ? "Ажлын албаны хариу хүлээгдэж байна." : "Ижил санаатай саналуудтай бүлэглэгдэхийг хүлээж байна."}
              </p>
            )}

            {c.clause.diff.length > 0 ? (
              <details className="mt-4 border-t border-line pt-3">
                <summary className="cursor-pointer text-[14.5px] font-medium text-action">Заалт хэрхэн өөрчлөгдөх вэ</summary>
                <DiffText parts={c.clause.diff} className="mt-2 text-[15px]" />
              </details>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
