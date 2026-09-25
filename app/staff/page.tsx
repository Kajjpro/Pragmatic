import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import { LawCard } from "@/components/law/law-card";
import { laws } from "@/lib/stub/laws";
import { reports } from "@/lib/stub/reports";
import { staffToday } from "@/lib/stub/context";

export default function StaffDashboardPage() {
  const highFlags = reports.reduce((a, r) => a + r.flagCounts.HIGH, 0);
  const midFlags = reports.reduce((a, r) => a + r.flagCounts.MEDIUM, 0);
  const inQueue = reports.filter((r) => r.status !== "published").length;

  const maybePassed = laws.filter((l) => l.stage === "debate");

  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Хүлээгдэж буй тайлан"
          value={inQueue}
          hint="Шалгах эсвэл нийтлэх шаардлагатай"
          tone="warn"
        />
        <StatCard
          label="Өндөр эрсдэлт мөрүүд"
          value={highFlags}
          hint="Ажилтны шийдвэр шаарддаг"
          tone="danger"
        />
        <StatCard
          label="Дунд эрсдэлт мөрүүд"
          value={midFlags}
          hint="AI санамжтай — эргэн харах"
          tone="warn"
        />
        <StatCard
          label="Өнөөдөр шийдвэрлэсэн"
          value={staffToday.decidedRows}
          hint={`Дундаж ${staffToday.avgSecondsPerRow} сек / мөр`}
          tone="good"
        />
      </section>

      <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-[0_20px_45px_-30px_rgba(15,42,99,0.3)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-parliament-900">
              Батлагдсан байж магадгүй хуулиуд
            </h2>
            <p className="mt-0.5 text-[12.5px] text-ink-500">
              Иргэдийн санал өндөр байгаа хэлэлцэгдэж буй төслүүд —
              баталгаажуулан нийтэд илгээх.
            </p>
          </div>
          <Link
            href="/staff/registry"
            className="rounded-full border border-parliament-100 px-3.5 py-1.5 text-[12px] font-semibold text-parliament-800 transition hover:border-parliament-500"
          >
            Хяналтын бүртгэл →
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {maybePassed.map((l) => (
            <div key={l.id} className="relative">
              <LawCard law={l} />
              <button className="absolute right-4 top-4 rounded-full bg-parliament-800 px-3 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-parliament-700">
                Баталгаажуулах
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
