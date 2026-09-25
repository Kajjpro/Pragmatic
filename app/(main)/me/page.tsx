import Link from "next/link";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { ReflectionBadge } from "@/components/feedback/reflection-badge";

// Хэрэглэгчийн саналыг бүлэг + хариутай нь татна.
// АНХААР: өмнө нь Reply.finalText-ийг уншдаг байсан ч ажилтны хариу
// хадгалах урсгал (saveGroupReply) нь Cluster.replyText-д бичдэг тул
// иргэнд хариу хэзээ ч харагддаггүй байв. Одоо зөв талбарыг уншина.
async function loadMyComments(userId: string) {
  return prisma.comment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      clause: {
        select: {
          id: true,
          number: true,
          project: { select: { id: true, title: true } },
        },
      },
      cluster: {
        select: {
          label: true,
          summary: true,
          replyText: true,
          reflection: true,
          repliedAt: true,
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

  // Хэдэн санал нь хариу авсан бэ — дээд талд харуулна
  const answered = comments.filter((c) => c.cluster?.repliedAt).length;
  const reflected = comments.filter(
    (c) => c.cluster?.repliedAt && c.cluster.reflection === "REFLECTED",
  ).length;

  return (
    <div className="flex flex-col">
      {/* Толгой — бараан хөх, градиенттэй */}
      <section className="chrome-brand relative overflow-hidden text-white">
        <div className="grain" aria-hidden />
        <div className="relative mx-auto max-w-[1000px] px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex flex-wrap items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-point-400 text-xl font-bold text-ink-950 ring-4 ring-white/15">
              {initial}
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-point-400">
                Миний санал
              </div>
              <h1 className="mt-0.5 font-editorial text-[26px] font-bold leading-tight sm:text-[32px]">
                {displayName}
              </h1>
            </div>
          </div>

          {/* Бодит тоонууд */}
          <dl className="mt-6 flex flex-wrap gap-2.5">
            <Stat value={comments.length} label="илгээсэн санал" />
            <Stat value={answered} label="хариу авсан" />
            <Stat value={reflected} label="тусгагдсан" highlight />
          </dl>
        </div>
      </section>

      <section className="flex-1 bg-brand-50/50 pb-16 pt-8">
        <div className="mx-auto max-w-[1000px] px-4 sm:px-6">
          {comments.length === 0 ? (
            <EmptyState
              title="Та одоогоор санал өгөөгүй байна"
              description="Хэлэлцэгдэж буй хууль дээр орж, тодорхой заалт дээр саналаа үлдээгээрэй. Ижил санаатай иргэдтэй бүлэгт нэгдэж, комиссын хариуг энд харна."
              action={
                <Link
                  href="/"
                  className="press inline-flex min-h-12 items-center gap-1.5 rounded-full bg-point-400 px-5 text-[15px] font-bold text-ink-950 shadow-sm hover:bg-point-300"
                >
                  Хуулиудыг үзэх →
                </Link>
              }
            />
          ) : (
            <ol className="flex flex-col gap-4">
              {comments.map((c) => {
                // Хариу нь зөвхөн ажилтан баталсан (repliedAt) үед харагдана
                const replied = Boolean(c.cluster?.repliedAt);
                const reply = replied ? c.cluster?.replyText : null;

                return (
                  <li
                    key={c.id}
                    className="rounded-2xl border border-ink-200 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(15,42,99,0.35)]"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink-600">
                      <StatusPill tone="info">{c.clause.number}</StatusPill>
                      <Link
                        href={`/bills/${c.clause.project.id}`}
                        className="min-w-0 flex-1 truncate font-medium text-brand-700 transition-colors hover:text-ink-950 hover:underline"
                      >
                        {c.clause.project.title}
                      </Link>
                      <time className="shrink-0 tabular-nums text-ink-600">
                        {c.createdAt.toISOString().slice(0, 10)}
                      </time>
                    </div>

                    {/* Миний бичсэн санал */}
                    <blockquote className="mt-3 border-l-4 border-brand-200 pl-3.5 text-[15px] leading-relaxed text-ink-900">
                      {c.body}
                    </blockquote>

                    {c.cluster ? (
                      <div className="mt-4 rounded-xl border border-ink-200 bg-brand-50/60 p-3.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <ReflectionBadge
                            value={
                              replied ? c.cluster.reflection : "PENDING"
                            }
                          />
                          <span className="text-[12px] font-bold uppercase tracking-wider text-brand-700">
                            Иргэдийн бүлэг
                          </span>
                        </div>
                        <div className="mt-2 text-[15px] font-bold text-ink-950">
                          {c.cluster.label}
                        </div>
                        {c.cluster.summary ? (
                          <p className="mt-1 text-[14px] leading-relaxed text-ink-700">
                            {c.cluster.summary}
                          </p>
                        ) : null}

                        {reply ? (
                          <div className="mt-3 rounded-lg border-l-4 border-emerald-500 bg-emerald-50 p-3 text-[14.5px] leading-relaxed text-emerald-900">
                            <div className="mb-1 text-[12px] font-bold uppercase tracking-wider text-emerald-800">
                              Комиссын хариу
                            </div>
                            {reply}
                          </div>
                        ) : (
                          <div className="mt-3 text-[13.5px] font-medium text-ink-600">
                            ⏳ Комиссын хариу хүлээгдэж байна
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border border-dashed border-ink-200 bg-brand-50/40 p-3 text-[13.5px] font-medium text-ink-600">
                        ⏳ Ижил санаатай иргэдтэй бүлэглэгдэхийг хүлээж байна
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}

// Толгой хэсгийн нэг тоо
function Stat({
  value,
  label,
  highlight,
}: {
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-xl bg-point-400 px-4 py-2.5 text-ink-950"
          : "rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/15"
      }
    >
      <dt className="font-editorial text-2xl font-bold tabular-nums">
        {value.toLocaleString("mn-MN")}
      </dt>
      <dd
        className={
          highlight
            ? "text-[12.5px] font-bold text-ink-950/80"
            : "text-[12.5px] font-medium text-white/75"
        }
      >
        {label}
      </dd>
    </div>
  );
}

function SignInPrompt() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[1000px] items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-ink-200 bg-white p-8 text-center shadow-[0_20px_45px_-30px_rgba(15,42,99,0.4)]">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-200">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
            <circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.7" />
            <path
              d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1 className="mt-4 font-editorial text-[24px] font-bold text-ink-950">
          Миний санал
        </h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-700">
          Нэвтэрсэн бол өөрийн өгсөн санал, тэдгээр саналууд бүлэглэгдэж хариу
          тавигдсан эсэхийг энд харна.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <SignInButton mode="modal">
            <button className="press min-h-12 rounded-full border border-brand-200 px-5 text-[14.5px] font-bold text-brand-700 hover:border-brand-400 hover:bg-brand-50">
              Нэвтрэх
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="press min-h-12 rounded-full bg-point-400 px-5 text-[14.5px] font-bold text-ink-950 shadow-sm hover:bg-point-300">
              Бүртгүүлэх
            </button>
          </SignUpButton>
        </div>
      </div>
    </div>
  );
}
