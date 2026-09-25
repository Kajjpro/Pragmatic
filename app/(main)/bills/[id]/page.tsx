import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getBillView } from "@/lib/law/queries";
import { EmptyState } from "@/components/ui/empty-state";
import { CommentForm } from "@/components/feedback/comment-form";
import { StageBar } from "@/components/law/stage-bar";
import { ClauseCompare } from "@/components/law/clause-compare";
import { ChangeExplain } from "@/components/law/change-explain";
import { ChangeBadge } from "@/components/law/change-badge";
import { ReflectionBadge } from "@/components/feedback/reflection-badge";

// Заалт бүрт хэдэн иргэн санал өгснийг тоолно (шүүгдсэнийг оруулахгүй).
// Иргэнд зориулсан тул зөвхөн уншина — юу ч өөрчлөхгүй.
async function loadCommentCounts(clauseIds: string[]) {
  const rows = await prisma.comment.groupBy({
    by: ["clauseId"],
    where: {
      clauseId: { in: clauseIds },
      OR: [{ filterStatus: null }, { filterStatus: "RELEVANT" }],
    },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.clauseId, r._count._all]));
}

export default async function BillPage({ params }: PageProps<"/bills/[id]">) {
  const { id } = await params;

  // Иргэн зөвхөн ажилтны баталсан, өөрчлөгдсөн заалтыг хардаг.
  const bill = await getBillView(id, false);
  if (!bill) notFound();

  const { userId } = await auth();
  const signedIn = Boolean(userId);
  const counts = await loadCommentCounts(bill.clauses.map((c) => c.id)).catch(
    () => new Map<string, number>(),
  );
  const totalComments = bill.clauses.reduce(
    (sum, c) => sum + (counts.get(c.id) ?? 0),
    0,
  );

  return (
    <div className="flex flex-col">
      {/* Гарчиг — бараан хөх, градиенттэй */}
      <section className="chrome-brand relative overflow-hidden text-white">
        <div className="grain" aria-hidden />
        <div className="relative mx-auto max-w-[900px] px-4 py-8 sm:px-6 sm:py-10">
          <nav className="flex flex-wrap items-center gap-2 text-[13px] text-white/75">
            <Link
              href="/"
              className="rounded transition-colors hover:text-point-400"
            >
              Хууль төсөл
            </Link>
            <span aria-hidden className="text-white/40">
              /
            </span>
            <span className="text-white">Заалтын харьцуулалт</span>
          </nav>

          <h1 className="mt-3 font-editorial text-[26px] font-bold leading-[1.18] sm:text-[34px]">
            {bill.title}
          </h1>

          {bill.reasonText ? (
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/85">
              {bill.reasonText}
            </p>
          ) : null}

          {/* Товч тоонууд */}
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-semibold ring-1 ring-white/20">
              <b className="tabular-nums text-point-400">
                {bill.clauses.length}
              </b>
              өөрчлөгдсөн заалт
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-semibold ring-1 ring-white/20">
              <b className="tabular-nums text-point-400">{totalComments}</b>
              иргэний санал
            </span>
          </div>

          <div className="mt-6 rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10">
            <StageBar current={bill.stage} size="sm" tone="dark" />
          </div>
        </div>
      </section>

      {/* Заалтууд */}
      <section className="bg-brand-50/50 pb-16 pt-8">
        <div className="mx-auto max-w-[900px] px-4 sm:px-6">
          {bill.clauses.length === 0 ? (
            <EmptyState
              title="Батлагдсан харьцуулалт алга байна"
              description="Ажилтан заалтуудыг баталмагц энд харагдана."
            />
          ) : (
            <ol className="flex flex-col gap-5">
              {bill.clauses.map((clause) => {
                const commentCount = counts.get(clause.id) ?? 0;
                return (
                  <li
                    key={clause.id}
                    className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[0_18px_40px_-30px_rgba(15,42,99,0.35)]"
                  >
                    {/* Заалтын толгой */}
                    <header className="flex flex-wrap items-center gap-2 border-b border-ink-100 bg-brand-50/60 px-4 py-3 sm:px-5">
                      <span className="rounded-md bg-brand-700 px-2 py-0.5 font-mono text-[12px] font-bold text-white">
                        {clause.number}
                      </span>
                      <ChangeBadge type={clause.changeType} />
                      {commentCount > 0 ? (
                        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-point-400 px-2.5 py-0.5 text-[12px] font-bold text-ink-950">
                          {commentCount} санал
                        </span>
                      ) : (
                        <span className="ml-auto text-[13px] text-ink-600">
                          Санал алга
                        </span>
                      )}
                    </header>

                    <div className="flex flex-col gap-4 p-4 sm:p-5">
                      <ClauseCompare
                        oldText={clause.oldText}
                        newText={clause.newText}
                        diff={clause.diff}
                      />

                      <ChangeExplain
                        what={clause.what}
                        why={clause.why}
                        who={clause.who}
                      />

                      {/* Иргэдийн бүлэг + комиссын хариу */}
                      {clause.groups.length > 0 ? (
                        <div className="flex flex-col gap-2.5">
                          <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-brand-700">
                            Иргэдийн саналд өгсөн хариу
                          </h3>
                          {clause.groups.map((g) => (
                            <article
                              key={g.id}
                              className="rounded-xl border border-ink-200 bg-brand-50/50 p-3.5"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <ReflectionBadge value={g.reflection} />
                                <span className="text-[13px] font-semibold text-ink-600">
                                  {g.commentCount.toLocaleString("mn-MN")} санал
                                </span>
                              </div>
                              <h4 className="mt-2 text-[15px] font-bold leading-snug text-ink-900">
                                {g.title}
                              </h4>
                              {g.summary ? (
                                <p className="mt-1 text-[14px] leading-relaxed text-ink-700">
                                  {g.summary}
                                </p>
                              ) : null}
                              {g.replyText ? (
                                <div className="mt-2.5 rounded-lg border-l-4 border-emerald-500 bg-emerald-50 p-3 text-[14px] leading-relaxed text-emerald-900">
                                  <div className="mb-1 text-[12px] font-bold uppercase tracking-wider text-emerald-800">
                                    Комиссын хариу
                                  </div>
                                  {g.replyText}
                                </div>
                              ) : null}
                            </article>
                          ))}
                        </div>
                      ) : null}

                      <CommentForm clauseId={clause.id} isSignedIn={signedIn} />
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/me"
              className="press inline-flex min-h-11 items-center gap-1.5 rounded-full bg-point-400 px-5 text-[14px] font-bold text-ink-950 shadow-sm hover:bg-point-300"
            >
              Миний санал тусгагдсан уу? →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
