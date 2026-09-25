import Link from "next/link";
import { getBillList } from "@/lib/law/queries";
import { stageLabels } from "@/lib/labels";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";

export default async function StaffPage() {
  // Ажилтны харагдац: бүх төсөл, бүх тоо (батлаагүй, шүүгдсэн гэх мэт)
  const bills = await getBillList(true);

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

      {bills.length === 0 ? (
        <EmptyState title="Одоогоор төсөл оруулаагүй байна." />
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {bills.map((b) => (
            <Link
              key={b.id}
              href={`/staff/bills/${b.id}`}
              className="group flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-5 shadow-[0_20px_45px_-30px_rgba(15,42,99,0.3)] transition hover:-translate-y-0.5 hover:border-parliament-200"
            >
              <div className="flex flex-wrap items-center gap-2">
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

              <h3 className="font-editorial text-[16px] font-medium leading-snug text-parliament-900 group-hover:text-parliament-700">
                {b.title}
              </h3>

              {/* Тоон үзүүлэлтүүд */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-ink-100 pt-3 text-[12px] text-ink-500 sm:grid-cols-3">
                <Count label="өөрчлөгдсөн заалт" value={b.changedCount} />
                <Count label="батлаагүй" value={b.unapprovedCount} />
                <Count label="иргэний санал" value={b.commentCount} />
                <Count label="хариулаагүй бүлэг" value={b.unansweredGroupCount} />
                <Count label="шүүгдсэн санал" value={b.filteredCount} />
              </div>

              <span className="text-right text-[12px] font-semibold text-parliament-700 group-hover:text-parliament-900">
                Ажлын ширээ нээх →
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
      <b className="text-parliament-700">{value}</b> {label}
    </span>
  );
}
