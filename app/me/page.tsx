import Link from "next/link";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { ReflectionBadge } from "@/components/feedback/reflection-badge";
import { ClauseCompare } from "@/components/law/clause-compare";
import { compareWords } from "@/lib/law/compare";

// Хэрэглэгчийн саналыг бүлэг + хариутай нь татна.
// Dev 1-ийн /api/me/comments бэлэн болмогц энд шилжүүлнэ.
async function loadMyComments(userId: string) {
  return prisma.comment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      clause: {
        select: {
          number: true,
          oldText: true,
          newText: true,
          project: { select: { id: true, title: true } },
        },
      },
      cluster: {
        select: {
          label: true,
          summary: true,
          reply: { select: { finalText: true, approvedAt: true, reflection: true } },
        },
      },
    },
  });
}

export default async function MePage() {
  const user = await getUser();

  if (!user) return <SignInPrompt />;

  const comments = await loadMyComments(user.id).catch(() => []);
  const displayName = user.name || user.email || "Иргэн";
  const initial = (displayName.trim()[0] ?? "?").toUpperCase();

  return (
    <div className="bg-parliament-50/30 pb-16">
      <section className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-6 py-6">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-parliament-700 text-lg font-semibold text-white ring-4 ring-parliament-100">
            {initial}
          </div>
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-parliament-500">
              Миний санал
            </div>
            <h1 className="font-editorial text-xl font-medium text-parliament-900">
              {displayName}
            </h1>
            <div className="text-[12px] text-ink-500">
              {comments.length
                ? `${comments.length} санал илгээсэн`
                : "Одоогоор санал илгээгээгүй"}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 pt-8">
        {comments.length === 0 ? (
          <EmptyState
            title="Та одоогоор санал өгөөгүй байна"
            description="Хэлэлцэгдэж буй хууль дээр орж, тодорхой заалт дээр саналаа үлдээгээрэй. Ижил санаатай иргэдтэй бүлэгт нэгдэж, комиссын хариуг энд харна."
            action={
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full bg-parliament-700 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-parliament-800"
              >
                Хуулиудыг үзэх →
              </Link>
            }
          />
        ) : (
          <ol className="flex flex-col gap-3">
            {comments.map((c) => {
              const reply = c.cluster?.reply?.finalText ?? null;
              const answered = Boolean(reply);
              const reflection = c.cluster?.reply?.reflection ?? "PENDING";
              // Заалт өөрчлөгдсөн бол өмнө/дараа харуулна
              const clauseChanged =
                (c.clause.oldText !== null || c.clause.newText !== null) &&
                c.clause.oldText !== c.clause.newText;
              return (
                <li
                  key={c.id}
                  className="rounded-2xl border border-ink-100 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(15,42,99,0.3)]"
                >
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-500">
                    <StatusPill tone="info">{c.clause.number}</StatusPill>
                    <span className="truncate">{c.clause.project.title}</span>
                    <span className="ml-auto">
                      {c.createdAt.toISOString().slice(0, 10)}
                    </span>
                  </div>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-ink-900">
                    {c.body}
                  </p>

                  {clauseChanged ? (
                    <div className="mt-3">
                      <ClauseCompare
                        oldText={c.clause.oldText}
                        newText={c.clause.newText}
                        diff={compareWords(c.clause.oldText, c.clause.newText)}
                      />
                    </div>
                  ) : null}

                  {c.cluster ? (
                    <div className="mt-3 rounded-xl bg-parliament-50/60 p-3 text-[12px]">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-parliament-500">
                        Иргэдийн бүлэг
                      </div>
                      <div className="mt-0.5 font-semibold text-parliament-900">
                        {c.cluster.label}
                      </div>
                      {c.cluster.summary ? (
                        <p className="mt-1 text-ink-500">{c.cluster.summary}</p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-3 text-[11.5px] text-ink-500">
                      ⏳ Ижил санаатай иргэдтэй бүлэглэгдэхийг хүлээж байна
                    </div>
                  )}

                  {answered ? (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[12.5px] leading-relaxed text-emerald-900">
                      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                        Комиссын хариу
                        <ReflectionBadge value={reflection} />
                      </div>
                      {reply}
                    </div>
                  ) : c.cluster ? (
                    <div className="mt-3 text-[11.5px] text-amber-800">
                      ⏳ Комиссын хариу хүлээгдэж байна
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

function SignInPrompt() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[1200px] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-ink-100 bg-white p-8 text-center shadow-[0_20px_45px_-30px_rgba(15,42,99,0.3)]">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-parliament-50 text-parliament-700">
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
            <circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.7" />
            <path
              d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1 className="mt-4 font-editorial text-xl font-medium text-parliament-900">
          Миний санал
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
          Нэвтэрсэн бол өөрийн өгсөн санал, тэдгээр саналууд бүлэглэгдэж
          хариу тавигдсан эсэхийг энд харна.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <SignInButton mode="modal">
            <button className="rounded-full border border-parliament-100 px-4 py-2 text-[12.5px] font-semibold text-parliament-700 transition hover:border-parliament-500">
              Нэвтрэх
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="rounded-full bg-parliament-700 px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-parliament-800">
              Бүртгүүлэх
            </button>
          </SignUpButton>
        </div>
      </div>
    </div>
  );
}
