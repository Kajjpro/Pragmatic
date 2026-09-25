import Link from "next/link";
import { notFound } from "next/navigation";
import { getLaw } from "@/lib/stub/laws";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { ReplyEditor } from "@/components/feedback/reply-editor";

const stanceMeta = {
  support: { label: "Дэмжсэн", tone: "good" as const, color: "text-emerald-700" },
  oppose: { label: "Эсэргүүцсэн", tone: "danger" as const, color: "text-rose-700" },
  neutral: { label: "Саармаг", tone: "neutral" as const, color: "text-ink-700" },
};

export default async function StaffLawFeedbackPage({
  params,
}: PageProps<"/staff/laws/[id]/feedback">) {
  const { id } = await params;
  const law = getLaw(id);
  if (!law) notFound();

  const totalOpinions = law.clauses.reduce(
    (acc, c) =>
      acc +
      c.opinionCounts.support +
      c.opinionCounts.oppose +
      c.opinionCounts.neutral,
    0,
  );
  const totalClusters = law.clauses.reduce((a, c) => a + c.clusters.length, 0);
  const awaitingReply = law.clauses.reduce(
    (a, c) => a + c.clusters.filter((cl) => !cl.response).length,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex items-center gap-2 text-[12px] text-ink-500">
        <Link href="/staff" className="hover:text-parliament-800">
          Ажилтны булан
        </Link>
        <span>/</span>
        <span className="text-parliament-900">Заалтын санал хариу</span>
      </nav>

      <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-[0_20px_45px_-30px_rgba(15,42,99,0.3)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <StatusPill tone="info">{law.category}</StatusPill>
              <span className="text-[11.5px] text-ink-500">
                Шинэчлэгдсэн {law.updatedAt}
              </span>
            </div>
            <h1 className="mt-2 text-xl font-bold text-parliament-900">
              {law.title}
            </h1>
            <p className="mt-1 text-[13px] text-ink-500">
              Иргэдийн санал заалт тус бүрд бүлэглэгдэн, комисс хариу боловсруулж
              байна.
            </p>
          </div>
          <div className="flex gap-2">
            <Metric label="Нийт санал" value={totalOpinions.toLocaleString("mn-MN")} />
            <Metric label="Бүлэг" value={totalClusters} />
            <Metric label="Хариу хүлээж буй" value={awaitingReply} tone="warn" />
          </div>
        </div>
      </section>

      {law.clauses.length === 0 ? (
        <EmptyState
          title="Заалт хараахан оруулагдаагүй байна"
          description="Хуулийн текст оруулагдсаны дараа иргэдийн бүлгүүд энд харагдана."
        />
      ) : (
        <div className="flex flex-col gap-8">
          {law.clauses.map((clause) => {
            const clauseTotal =
              clause.opinionCounts.support +
              clause.opinionCounts.oppose +
              clause.opinionCounts.neutral;
            return (
              <section
                key={clause.id}
                className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-[0_20px_45px_-30px_rgba(15,42,99,0.3)]"
              >
                <header className="flex items-center justify-between border-b border-ink-100 bg-parliament-50/50 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <StatusPill tone="info">{clause.number}</StatusPill>
                    <span className="text-[11.5px] text-ink-500">
                      {clauseTotal.toLocaleString("mn-MN")} санал ·{" "}
                      {clause.clusters.length} бүлэг
                    </span>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full bg-parliament-800 px-3.5 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-parliament-700"
                  >
                    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
                      <circle cx="6" cy="7" r="2" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="14" cy="7" r="2" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="10" cy="14" r="2" stroke="currentColor" strokeWidth="1.5" />
                      <path
                        d="M8 8l1.5 4.5M12 8l-1.5 4.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                    Дахин бүлэглэх
                  </button>
                </header>

                <div className="border-b border-ink-100 px-5 py-4 text-[12.5px] leading-relaxed text-ink-700">
                  {clause.originalText}
                </div>

                <div className="grid grid-cols-1 divide-y divide-ink-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                  <div className="px-5 py-4">
                    <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-parliament-500">
                      Иргэдийн бүлгүүд
                    </h3>
                    <ol className="mt-3 flex flex-col gap-2">
                      {clause.clusters.map((c) => {
                        const meta = stanceMeta[c.stance];
                        return (
                          <li
                            key={c.id}
                            className="rounded-xl border border-ink-100 bg-parliament-50/30 p-3"
                          >
                            <div className="flex items-center gap-2">
                              <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                              <span className={`text-[11px] font-semibold ${meta.color}`}>
                                {c.count.toLocaleString("mn-MN")}
                              </span>
                              {c.response ? (
                                <StatusPill tone="good" className="ml-auto">
                                  Хариу өгсөн
                                </StatusPill>
                              ) : (
                                <StatusPill tone="warn" className="ml-auto">
                                  Хариу хүлээж буй
                                </StatusPill>
                              )}
                            </div>
                            <div className="mt-1.5 text-[13px] font-semibold text-ink-900">
                              {c.label}
                            </div>
                            <p className="mt-1 text-[12px] leading-relaxed text-ink-500">
                              {c.summary}
                            </p>
                          </li>
                        );
                      })}
                    </ol>
                  </div>

                  <div className="px-5 py-4">
                    <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-parliament-500">
                      Комиссын хариу
                    </h3>
                    <div className="mt-3 flex flex-col gap-3">
                      {clause.clusters.map((c) => (
                        <div key={c.id}>
                          <div className="mb-1.5 text-[11.5px] font-semibold text-ink-900">
                            → {c.label}
                          </div>
                          <ReplyEditor
                            seedDraft={
                              c.response ??
                              `«${c.label}» бүлгийн ${c.count.toLocaleString(
                                "mn-MN",
                              )} санал хүлээн авав. Заалтын ${clause.number.split(" ")[0]}-т тодотгол оруулах саналыг комисс дараагийн хуралдаанаар авч үзнэ.`
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "warn";
}) {
  return (
    <div
      className={`rounded-xl px-3 py-2 text-center ${
        tone === "warn"
          ? "bg-amber-100 text-amber-800"
          : "bg-parliament-50 text-parliament-800"
      }`}
    >
      <div className="text-[10.5px] font-semibold uppercase tracking-wider opacity-80">
        {label}
      </div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
    </div>
  );
}
