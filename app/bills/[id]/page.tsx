import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { mockBill } from "@/lib/mock";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { CommentForm } from "@/components/feedback/comment-form";
import { StageBar } from "@/components/law/stage-bar";
import { ClauseCompare } from "@/components/law/clause-compare";
import { ChangeExplain } from "@/components/law/change-explain";
import { ChangeBadge } from "@/components/law/change-badge";
import { ReflectionBadge } from "@/components/feedback/reflection-badge";

async function loadBill(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      clauses: {
        orderBy: { order: "asc" },
        include: {
          _count: { select: { comments: true } },
        },
      },
    },
  });
}

// Заалтын дугаар (14.2 гэх мэт) дээр үндэслэн mock-той нэгтгэж diff/explain-ыг гаргаж авна.
function mockByNumber(number: string) {
  return mockBill.clauses.find((c) => c.number === number) ?? null;
}

export default async function BillPage({
  params,
}: PageProps<"/bills/[id]">) {
  const { id } = await params;
  const bill = await loadBill(id);
  if (!bill) notFound();

  const { userId } = await auth();
  const signedIn = Boolean(userId);

  return (
    <div className="bg-parliament-50/30 pb-16">
      <section className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-[900px] px-6 py-8">
          <nav className="flex items-center gap-2 text-[12px] text-ink-500">
            <Link href="/" className="hover:text-parliament-700">
              Хуулиуд
            </Link>
            <span>/</span>
            <span className="text-parliament-900">{bill.projectNumber}</span>
          </nav>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {bill.categoryTitle ? (
              <StatusPill tone="info">{bill.categoryTitle}</StatusPill>
            ) : null}
            {bill.typeTitle ? (
              <span className="text-[11.5px] text-ink-500">
                {bill.typeTitle}
              </span>
            ) : null}
          </div>
          <h1 className="mt-2 font-editorial text-2xl font-medium text-parliament-900">
            {bill.title}
          </h1>
          {bill.description ? (
            <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ink-700">
              {bill.description}
            </p>
          ) : null}
          <div className="mt-5">
            <StageBar current={mockBill.stage} size="sm" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[900px] px-6 pt-8">
        {bill.clauses.length === 0 ? (
          <EmptyState
            title="Заалт оруулаагүй байна"
            description="Ажилтан заалт оруулмагц энд харагдана."
          />
        ) : (
          <ol className="flex flex-col gap-4">
            {bill.clauses.map((clause) => {
              const overlay = mockByNumber(clause.number);
              const hasDiff = overlay && overlay.changeType !== "UNCHANGED";
              return (
                <li
                  key={clause.id}
                  className="rounded-2xl border border-ink-100 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(15,42,99,0.3)]"
                >
                  <header className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-parliament-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-parliament-700">
                      {clause.number}
                    </span>
                    {overlay ? (
                      <ChangeBadge type={overlay.changeType} />
                    ) : null}
                    {clause.heading ? (
                      <span className="text-[13px] font-semibold text-parliament-900">
                        {clause.heading}
                      </span>
                    ) : null}
                    <span className="ml-auto text-[11px] text-ink-500">
                      {clause._count.comments} санал
                    </span>
                  </header>

                  {hasDiff ? (
                    <div className="mt-4">
                      <ClauseCompare
                        oldText={overlay!.oldText}
                        newText={overlay!.newText}
                        diff={overlay!.diff}
                      />
                    </div>
                  ) : (
                    <p className="mt-3 text-[13.5px] leading-relaxed text-ink-900">
                      {clause.newText ?? clause.oldText}
                    </p>
                  )}

                  {overlay ? (
                    <div className="mt-4">
                      <ChangeExplain
                        what={overlay.what}
                        why={overlay.why}
                        who={overlay.who}
                      />
                    </div>
                  ) : clause.plainText ? (
                    <div className="mt-3 rounded-xl bg-parliament-50/60 p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-parliament-500">
                        Энгийн тайлбар
                      </div>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-parliament-900">
                        {clause.plainText}
                      </p>
                    </div>
                  ) : null}

                  {overlay && overlay.groups.length ? (
                    <div className="mt-4 flex flex-col gap-2">
                      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-500">
                        Иргэдийн бүлгүүд
                      </div>
                      {overlay.groups.map((g) => (
                        <div
                          key={g.id}
                          className="rounded-xl border border-ink-100 bg-parliament-50/30 p-3"
                        >
                          <div className="flex items-center gap-2">
                            <ReflectionBadge value={g.reflection} />
                            <span className="text-[11px] text-ink-500">
                              {g.commentCount.toLocaleString("mn-MN")} санал
                            </span>
                          </div>
                          <div className="mt-1.5 text-[13px] font-semibold text-ink-900">
                            {g.title}
                          </div>
                          <p className="mt-1 text-[12px] leading-relaxed text-ink-500">
                            {g.summary}
                          </p>
                          {g.replyText ? (
                            <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-[12.5px] leading-relaxed text-emerald-900">
                              <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                                ✅ Комисс
                              </div>
                              {g.replyText}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-4">
                    <CommentForm clauseId={clause.id} isSignedIn={signedIn} />
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
