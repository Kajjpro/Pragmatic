import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import { reports } from "@/lib/stub/reports";
import { staffToday } from "@/lib/stub/context";

export default function StaffDashboardPage() {
  const highFlags = reports.reduce((a, r) => a + r.flagCounts.HIGH, 0);
  const inQueue = reports.filter((r) => r.status !== "published").length;
  const nextReport = reports.find((r) => r.status !== "published");

  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Хүлээгдэж буй тайлан"
          value={inQueue}
          hint="Шалгах шаардлагатай"
          tone="warn"
        />
        <StatCard
          label="Өндөр эрсдэлт мөрүүд"
          value={highFlags}
          hint="Ажилтны шийдвэр"
          tone="danger"
        />
        <StatCard
          label="Өнөөдөр шийдвэрлэсэн"
          value={staffToday.decidedRows}
          hint={`Дундаж ${staffToday.avgSecondsPerRow} сек / мөр`}
          tone="good"
        />
      </section>

      {nextReport ? (
        <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-[0_20px_45px_-30px_rgba(15,42,99,0.3)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-parliament-500">
                Дараагийн ажил
              </div>
              <h2 className="mt-1 font-editorial text-xl font-medium text-parliament-900">
                {nextReport.agency}
              </h2>
              <div className="mt-0.5 text-[12.5px] text-ink-500">
                {nextReport.period} · {nextReport.totalRows} мөр ·{" "}
                <span className="text-rose-700">
                  {nextReport.flagCounts.HIGH} өндөр
                </span>{" "}
                / {nextReport.flagCounts.MEDIUM} дунд
              </div>
            </div>
            <Link
              href={`/staff/reports/${nextReport.id}`}
              className="rounded-full bg-parliament-700 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-parliament-800"
            >
              Шалгаж эхлэх →
            </Link>
          </div>
        </section>
      ) : null}

      <section className="flex flex-wrap items-center gap-3">
        <Link
          href="/staff/reports"
          className="rounded-full border border-ink-100 bg-white px-4 py-2 text-[12px] font-semibold text-parliament-700 shadow-sm transition hover:border-parliament-500"
        >
          Тайлан шалгагч →
        </Link>
        <Link
          href="/staff/registry"
          className="rounded-full border border-ink-100 bg-white px-4 py-2 text-[12px] font-semibold text-parliament-700 shadow-sm transition hover:border-parliament-500"
        >
          Хяналтын бүртгэл →
        </Link>
        <Link
          href="/staff/ask"
          className="rounded-full border border-ink-100 bg-white px-4 py-2 text-[12px] font-semibold text-parliament-700 shadow-sm transition hover:border-parliament-500"
        >
          AI туслах →
        </Link>
      </section>
    </div>
  );
}
