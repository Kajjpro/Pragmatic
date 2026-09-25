import Link from "next/link";
import { intakeQueue, stageMeta } from "@/lib/stub/intake";
import { StatusPill } from "@/components/ui/status-pill";
import { StatCard } from "@/components/ui/stat-card";

export default function IntakePage() {
  const byStage = intakeQueue.reduce<Record<string, number>>((acc, it) => {
    acc[it.stage] = (acc[it.stage] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-parliament-900">
            Тайлан хүлээн авах урсгал
          </h1>
          <p className="mt-1 text-[13px] text-ink-500">
            Байгууллагуудын илгээсэн файл болон API-аар ирсэн тайлангийн
            боловсруулалтын явц.
          </p>
        </div>
        <button className="rounded-full bg-parliament-800 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-parliament-700">
          + Гар шалгалт нээх
        </button>
      </div>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Хүлээн авсан (өнөөдөр)"
          value={intakeQueue.length}
          hint="6 файл, дунджаар 3.2MB"
          tone="neutral"
        />
        <StatCard
          label="Боловсруулж буй"
          value={
            (byStage["parsing"] ?? 0) +
            (byStage["matching"] ?? 0) +
            (byStage["flagging"] ?? 0)
          }
          hint="Дундаж хугацаа: 2 мин 15 сек"
          tone="warn"
        />
        <StatCard
          label="Шалгахад бэлэн"
          value={byStage["ready"] ?? 0}
          hint="Ажилтанд дамжуулсан"
          tone="good"
        />
        <StatCard
          label="Алдаатай"
          value={byStage["error"] ?? 0}
          hint="Дахин илгээх шаардлагатай"
          tone="danger"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-[0_20px_45px_-30px_rgba(15,42,99,0.3)]">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-parliament-50/60 text-[10.5px] font-semibold uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-5 py-3">Файл</th>
              <th className="px-2 py-3">Байгууллага</th>
              <th className="px-2 py-3">Хугацаа</th>
              <th className="px-2 py-3">Явц</th>
              <th className="px-2 py-3">Тэмдэглэл</th>
              <th className="px-5 py-3 text-right">Үйлдэл</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {intakeQueue.map((it) => {
              const m = stageMeta[it.stage];
              return (
                <tr
                  key={it.id}
                  className="transition hover:bg-parliament-50/40"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-parliament-50 text-parliament-700">
                        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                          <path
                            d="M6 3h6l3 3v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <path d="M12 3v3h3" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      </span>
                      <div>
                        <div className="font-mono text-[11.5px] font-semibold text-ink-900">
                          {it.file}
                        </div>
                        <div className="text-[10.5px] text-ink-500">
                          {it.size} · {it.submittedAt}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3.5 text-ink-700">{it.agency}</td>
                  <td className="px-2 py-3.5 text-ink-700">{it.period}</td>
                  <td className="px-2 py-3.5">
                    <div className="flex items-center gap-2">
                      <StatusPill tone={m.tone}>{m.label}</StatusPill>
                      {it.stage !== "ready" && it.stage !== "error" ? (
                        <span className="inline-flex h-4 w-16 overflow-hidden rounded-full bg-ink-100">
                          <span className="animate-pulse rounded-full bg-parliament-500" style={{ width: it.stage === "parsing" ? "30%" : it.stage === "matching" ? "60%" : "85%" }} />
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-2 py-3.5 text-[12px] text-ink-500">
                    {it.message}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {it.reportId ? (
                      <Link
                        href={`/staff/reports/${it.reportId}`}
                        className="rounded-full border border-parliament-100 px-3 py-1 text-[11px] font-semibold text-parliament-800 transition hover:border-parliament-500"
                      >
                        Шалгах →
                      </Link>
                    ) : it.stage === "error" ? (
                      <button className="rounded-full border border-rose-200 px-3 py-1 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-50">
                        Дахин илгээх
                      </button>
                    ) : (
                      <span className="text-[11px] text-ink-500">
                        Хүлээгдэж…
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
