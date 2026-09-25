import Link from "next/link";
import { reports } from "@/lib/stub/reports";
import { StatusPill } from "@/components/ui/status-pill";
import { FlagBadge } from "@/components/monitoring/flag-badge";

const statusMap: Record<
  (typeof reports)[number]["status"],
  { label: string; tone: "info" | "warn" | "good" }
> = {
  queued: { label: "Хүлээгдэж буй", tone: "warn" },
  reviewing: { label: "Шалгагдаж буй", tone: "info" },
  published: { label: "Нийтлэгдсэн", tone: "good" },
};

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="text-xl font-bold text-parliament-900">
            Тайлан шалгагч
          </h1>
          <p className="mt-1 text-[13px] text-ink-500">
            Байгууллагуудаас ирсэн биелэлтийн тайланг шалгаж, тэмдэглэгээ бүрд
            шийдвэр гарган нийтэд ил тод болгоно.
          </p>
        </div>

        <form className="rounded-2xl border border-dashed border-parliament-200 bg-parliament-50/40 p-4">
          <h3 className="text-[13px] font-semibold text-parliament-900">
            Шинэ тайлан оруулах
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="flex flex-col text-[11px] font-semibold text-ink-500">
              Байгууллага
              <input
                className="mt-1 h-9 rounded-lg border border-ink-100 bg-white px-2 text-[12px] font-normal text-ink-900 outline-none focus:border-parliament-500"
                placeholder="Яамны нэр"
              />
            </label>
            <label className="flex flex-col text-[11px] font-semibold text-ink-500">
              Хугацаа
              <input
                className="mt-1 h-9 rounded-lg border border-ink-100 bg-white px-2 text-[12px] font-normal text-ink-900 outline-none focus:border-parliament-500"
                placeholder="2026 III улирал"
              />
            </label>
            <label className="col-span-2 flex flex-col text-[11px] font-semibold text-ink-500">
              Төрөл
              <select className="mt-1 h-9 rounded-lg border border-ink-100 bg-white px-2 text-[12px] font-normal text-ink-900 outline-none focus:border-parliament-500">
                <option>Улирлын биелэлт</option>
                <option>Жилийн тайлан</option>
                <option>Тусгай тайлан</option>
              </select>
            </label>
            <label className="col-span-2 flex flex-col text-[11px] font-semibold text-ink-500">
              Өмнөх тайлан (заавал биш)
              <select className="mt-1 h-9 rounded-lg border border-ink-100 bg-white px-2 text-[12px] font-normal text-ink-900 outline-none focus:border-parliament-500">
                <option value="">Сонгох...</option>
                {reports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.agency} — {r.period}
                  </option>
                ))}
              </select>
            </label>
            <label className="col-span-2 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-parliament-300 bg-white px-3 py-2.5 text-[12px] text-parliament-800 transition hover:bg-parliament-50">
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                <path
                  d="M10 3v10m0 0-4-4m4 4 4-4M4 17h12"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Файл сонгох (.docx, .pdf)
              <input type="file" className="hidden" />
            </label>
            <button
              type="button"
              className="col-span-2 mt-1 rounded-full bg-parliament-800 py-2 text-[12px] font-semibold text-white transition hover:bg-parliament-700"
            >
              Оруулж, боловсруулах эхлүүлэх
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-[0_20px_45px_-30px_rgba(15,42,99,0.3)]">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-parliament-50/60 text-[10.5px] font-semibold uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-5 py-3">Байгууллага</th>
              <th className="px-2 py-3">Хугацаа</th>
              <th className="px-2 py-3">Төрөл</th>
              <th className="px-2 py-3">Статус</th>
              <th className="px-2 py-3">Мөр</th>
              <th className="px-2 py-3">Тэмдэглэгээ</th>
              <th className="px-5 py-3 text-right">Огноо</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {reports.map((r) => {
              const s = statusMap[r.status];
              return (
                <tr
                  key={r.id}
                  className="group transition hover:bg-parliament-50/40"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/staff/reports/${r.id}`}
                      className="font-semibold text-ink-900 transition group-hover:text-parliament-900"
                    >
                      {r.agency}
                    </Link>
                    <div className="text-[11px] text-ink-500">{r.id}</div>
                  </td>
                  <td className="px-2 py-3.5 text-ink-700">{r.period}</td>
                  <td className="px-2 py-3.5 text-ink-700">{r.type}</td>
                  <td className="px-2 py-3.5">
                    <StatusPill tone={s.tone}>{s.label}</StatusPill>
                  </td>
                  <td className="px-2 py-3.5 tabular-nums text-ink-900">
                    {r.totalRows}
                  </td>
                  <td className="px-2 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {r.flagCounts.HIGH > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <FlagBadge level="HIGH" />
                          <span className="text-[11px] font-semibold text-rose-700">
                            {r.flagCounts.HIGH}
                          </span>
                        </span>
                      ) : null}
                      {r.flagCounts.MEDIUM > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <FlagBadge level="MEDIUM" />
                          <span className="text-[11px] font-semibold text-amber-700">
                            {r.flagCounts.MEDIUM}
                          </span>
                        </span>
                      ) : null}
                      {r.flagCounts.LOW > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <FlagBadge level="LOW" />
                          <span className="text-[11px] font-semibold text-ink-500">
                            {r.flagCounts.LOW}
                          </span>
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right text-[11.5px] text-ink-500">
                    {r.submittedAt}
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
