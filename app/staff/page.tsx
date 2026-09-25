import Link from "next/link";
import { Plus } from "lucide-react";
import { getBillList } from "@/lib/law/queries";
import { stageLabels } from "@/lib/labels";
import { Pill } from "@/components/ui/pill";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";

export default async function StaffPage() {
  // Ажилтны харагдац: бүх төсөл, бүх тоо (батлаагүй, шүүгдсэн гэх мэт)
  const bills = await getBillList(true);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-6">
        <div>
          <h1 className="text-[30px] font-bold">Төслүүд</h1>
          <p className="mt-1 text-muted">Заалт бүрийн харьцуулалт, иргэдийн санал, хариуг эндээс шалгана.</p>
        </div>
        <Link href="/staff/bills/new" className={buttonClass("primary")}>
          <Plus aria-hidden className="h-4 w-4" /> Шинэ төсөл оруулах
        </Link>
      </section>

      {bills.length === 0 ? (
        <EmptyState title="Одоогоор төсөл оруулаагүй байна" description="Хүчин төгөлдөр хууль ба төслийн текстийг оруулахад заалт бүрийн харьцуулалт үүснэ." />
      ) : (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {bills.map((b) => (
            <Link key={b.id} href={`/staff/bills/${b.id}`} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5 hover:border-primary">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="action">{stageLabels[b.stage]}</Pill>
                {b.unapprovedCount > 0 ? <Pill tone="warn">{b.unapprovedCount} заалт батлаагүй</Pill> : null}
                {b.unansweredGroupCount > 0 ? <Pill tone="bad">{b.unansweredGroupCount} бүлэг хариулаагүй</Pill> : null}
              </div>
              <h2 className="text-[20px] font-bold leading-snug">{b.title}</h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-line pt-3 text-[14.5px] sm:grid-cols-3">
                <Count label="Өөрчлөгдсөн заалт" value={b.changedCount} />
                <Count label="Батлаагүй" value={b.unapprovedCount} />
                <Count label="Иргэний санал" value={b.commentCount} />
                <Count label="Хариулаагүй бүлэг" value={b.unansweredGroupCount} />
                <Count label="Шүүгдсэн санал" value={b.filteredCount} />
              </dl>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold tabular-nums text-heading">{value}</dd>
    </div>
  );
}
