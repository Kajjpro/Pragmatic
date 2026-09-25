import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MOCK_BILL_ID, mockBillSummary } from "@/lib/mock";
import { listBillSummaries } from "@/lib/law/queries";
import { StageBar } from "@/components/law/stage-bar";
import { StatusPill } from "@/components/ui/status-pill";

async function loadStaffBills() {
  // Prisma-с жинхэнэ хууль (санал авах загварт), демо mock-той нэгтгэн харуулна.
  const real = await prisma.project
    .findMany({
      where: { source: "LAWFORUM" },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        categoryTitle: true,
        projectNumber: true,
        _count: { select: { clauses: true } },
      },
    })
    .catch(() => []);
  return real;
}

export default async function StaffPage() {
  const real = await loadStaffBills();
  // AI урсгалаар оруулсан төслүүд
  const bills = await listBillSummaries().catch(() => []);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-editorial text-2xl font-medium text-parliament-900">
            Миний төслүүд
          </h1>
          <p className="mt-1 text-[13px] text-ink-500">
            Хуулийн харьцуулалт, иргэдийн саналыг эндээс шалгана.
          </p>
        </div>
        <Link
          href="/staff/bills/new"
          className="inline-flex items-center gap-2 rounded-full bg-parliament-700 px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-parliament-800"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path
              d="M10 4v12M4 10h12"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          Шинэ төсөл оруулах
        </Link>
      </section>

      {/* AI урсгалаар оруулсан төслүүд (DB) */}
      {bills.length ? (
        <section>
          <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-parliament-500">
            Оруулсан төслүүд
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {bills.map((b) => (
              <Link
                key={b.id}
                href={`/staff/bills/${b.id}`}
                className="group flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-5 shadow-[0_20px_45px_-30px_rgba(15,42,99,0.3)] transition hover:-translate-y-0.5 hover:border-parliament-200"
              >
                <h3 className="font-editorial text-[16px] font-medium leading-snug text-parliament-900 group-hover:text-parliament-700">
                  {b.title}
                </h3>
                <StageBar current={b.stage} size="sm" />
                <div className="flex flex-wrap items-center gap-4 border-t border-ink-100 pt-3 text-[11.5px] text-ink-500">
                  <span>
                    <b className="text-parliament-700">{b.changedCount}</b> өөрчлөлт
                  </span>
                  <span>
                    <b className="text-parliament-700">{b.unapprovedCount}</b> батлаагүй
                  </span>
                  <span>
                    <b className="text-parliament-700">{b.commentCount}</b> санал
                  </span>
                  <span>
                    <b className="text-parliament-700">{b.filteredCount}</b> шүүгдсэн
                  </span>
                  <span>
                    <b className="text-parliament-700">{b.unansweredGroupCount}</b> бүлэг хариулаагүй
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Демо (mock) — питчийн үндсэн үзүүлбэр */}
      <section>
        <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-gold-500">
          Демо · үзүүлбэрийн хууль
        </div>
        <Link
          href={`/staff/bills/${MOCK_BILL_ID}`}
          className="group flex flex-col gap-3 rounded-2xl border border-gold-300 bg-gradient-to-br from-gold-100/50 to-white p-5 shadow-[0_20px_45px_-30px_rgba(255,198,7,0.4)] transition hover:-translate-y-0.5 hover:border-gold-400"
        >
          <div className="flex items-center gap-2">
            <StatusPill tone="warn">Демо</StatusPill>
            <span className="text-[11px] text-ink-500">{mockBillSummary.id}</span>
          </div>
          <h3 className="font-editorial text-[17px] font-medium leading-snug text-parliament-900 group-hover:text-parliament-700">
            {mockBillSummary.title}
          </h3>
          <StageBar current={mockBillSummary.stage} size="sm" />
          <div className="flex flex-wrap items-center gap-4 border-t border-ink-100 pt-3 text-[11.5px] text-ink-500">
            <span>
              <b className="text-parliament-700">{mockBillSummary.changedCount}</b>{" "}
              өөрчлөлт шалгах
            </span>
            <span>
              <b className="text-parliament-700">
                {mockBillSummary.unansweredGroupCount}
              </b>{" "}
              бүлэг хариулаагүй
            </span>
            <span className="ml-auto font-semibold text-parliament-700 group-hover:text-parliament-900">
              Ажлын ширээ нээх →
            </span>
          </div>
        </Link>
      </section>

      {real.length ? (
        <section>
          <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-parliament-500">
            Бусад хууль (иргэний саналын хуудсанд харагдана)
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {real.map((b) => (
              <Link
                key={b.id}
                href={`/bills/${b.id}`}
                className="group rounded-2xl border border-ink-100 bg-white p-5 shadow-[0_20px_45px_-30px_rgba(15,42,99,0.3)] transition hover:-translate-y-0.5 hover:border-parliament-200"
              >
                <div className="flex items-center gap-2">
                  {b.categoryTitle ? (
                    <StatusPill tone="info">{b.categoryTitle}</StatusPill>
                  ) : null}
                  {b.projectNumber ? (
                    <span className="ml-auto font-mono text-[10.5px] text-ink-500">
                      {b.projectNumber}
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-2 font-editorial text-[15px] font-medium leading-snug text-ink-900 group-hover:text-parliament-700">
                  {b.title}
                </h3>
                <div className="mt-3 flex items-center gap-3 border-t border-ink-100 pt-3 text-[11.5px] text-ink-500">
                  <span>
                    <b className="text-parliament-700">{b._count.clauses}</b> заалт
                  </span>
                  <span className="ml-auto font-semibold text-parliament-700 group-hover:text-parliament-900">
                    Үзэх →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
