import Link from "next/link";
import { getBillList } from "@/lib/law/queries";
import { stageLabels } from "@/lib/labels";
import { StatusPill } from "@/components/ui/status-pill";
import { BillStatusBadge } from "@/components/bill/bill-status";
import { EmptyState } from "@/components/ui/empty-state";

export default async function StaffPage() {
  // Ажилтны харагдац: бүх төсөл, бүх тоо (батлаагүй, шүүгдсэн гэх мэт)
  const bills = await getBillList(true);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-editorial text-[28px] font-bold text-ink-950 sm:text-[32px]">
            Миний төслүүд
          </h1>
          <p className="mt-1 text-[14.5px] leading-relaxed text-ink-700">
            Хуулийн харьцуулалт, иргэдийн саналыг эндээс шалгана.
          </p>
        </div>
        <Link
          href="/staff/bills/new"
          className="press inline-flex min-h-12 items-center gap-2 rounded-full bg-point-400 px-5 text-[15px] font-bold text-ink-950 shadow-[0_8px_24px_-8px_rgba(255,198,7,0.6)] hover:bg-point-300"
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

      {bills.length === 0 ? (
        <EmptyState title="Одоогоор төсөл оруулаагүй байна." />
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {bills.map((b) => (
            <Link
              key={b.id}
              href={`/staff/bills/${b.id}`}
              className="card-lift group flex flex-col gap-3 rounded-2xl border border-ink-200 bg-white p-5 shadow-[0_20px_45px_-30px_rgba(15,42,99,0.3)] hover:border-brand-300 hover:shadow-[0_28px_60px_-30px_rgba(15,42,99,0.5)]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <BillStatusBadge stage={b.stage} />
                <StatusPill tone="info">{stageLabels[b.stage]}</StatusPill>
                {b.unapprovedCount > 0 ? (
                  <StatusPill tone="warn">
                    {b.unapprovedCount} заалт батлаагүй
                  </StatusPill>
                ) : null}
                {b.unansweredGroupCount > 0 ? (
                  <StatusPill tone="danger">
                    {b.unansweredGroupCount} бүлэг хариулаагүй
                  </StatusPill>
                ) : null}
              </div>

              <h3 className="font-editorial text-[19px] font-bold leading-snug text-ink-950 transition-colors group-hover:text-brand-700">
                {b.title}
              </h3>

              {/* Тоон үзүүлэлтүүд */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-ink-100 pt-3 text-[13px] text-ink-600 sm:grid-cols-3">
                <Count label="өөрчлөгдсөн заалт" value={b.changedCount} />
                <Count label="батлаагүй" value={b.unapprovedCount} />
                <Count label="иргэний санал" value={b.commentCount} />
                <Count label="хариулаагүй бүлэг" value={b.unansweredGroupCount} />
                <Count label="шүүгдсэн санал" value={b.filteredCount} />
              </div>

              <span className="inline-flex items-center justify-end gap-1 text-[14px] font-bold text-brand-700 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-950">
                Ажлын ширээ нээх <span aria-hidden>→</span>
              </span>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}

// Нэг тоо + тайлбар
function Count({ label, value }: { label: string; value: number }) {
  return (
    <span>
      <b className="tabular-nums text-brand-700">{value}</b> {label}
    </span>
  );
}
