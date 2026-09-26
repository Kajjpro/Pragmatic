import Link from "next/link";
import { ArrowRight, Filter, Inbox, Layers, MessageSquareReply, Plus } from "lucide-react";
import { getBillList } from "@/lib/law/queries";
import { stageLabels } from "@/lib/labels";
import { Pill } from "@/components/ui/pill";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";
import { SyncProjectsButton } from "@/components/staff/sync-projects-button";

export default async function StaffPage() {
  // Ажилтны харагдац: бүх төсөл, бүх тоо (батлаагүй, шүүгдсэн гэх мэт)
  const all = await getBillList(true);
  // Хариу хүлээж буй бүлэгтэй, дараа нь батлаагүй заалттай төсөл эхэнд — ажилтан юунаас эхлэхээ шууд харна
  const bills = [...all].sort(
    (a, b) => b.unansweredGroupCount - a.unansweredGroupCount || b.unapprovedCount - a.unapprovedCount,
  );
  const total = {
    comments: all.reduce((n, b) => n + b.commentCount, 0),
    filtered: all.reduce((n, b) => n + b.filteredCount, 0),
    unanswered: all.reduce((n, b) => n + b.unansweredGroupCount, 0),
  };
  const pipeline = [
    { icon: Inbox, label: "Иргэдийн санал", value: total.comments, note: "Бүх төслөөр" },
    { icon: Filter, label: "AI шүүсэн", value: total.filtered, note: "Хамааралгүй, давхардсан — устгаагүй" },
    { icon: Layers, label: "Хамааралтай санал", value: total.comments - total.filtered, note: "AI агуулгаар нь бүлэглэнэ" },
    { icon: MessageSquareReply, label: "Хариу хүлээж буй бүлэг", value: total.unanswered, note: "«Тусгасан» бол иргэнд тэмдэг" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-6">
        <div>
          <h1 className="text-[30px] font-bold">Төслүүд</h1>
          <p className="mt-1 text-muted">Заалт бүрийн харьцуулалт, иргэдийн санал, хариуг эндээс шалгана.</p>
        </div>
        <div className="flex flex-wrap items-start gap-3">
          <SyncProjectsButton />
          <Link href="/staff/bills/new" className={buttonClass("primary")}>
            <Plus aria-hidden className="h-4 w-4" /> Шинэ төсөл оруулах
          </Link>
        </div>
      </section>

      {/* AI урсгал: санал → шүүлт → бүлэг → хариу. Нэг мөрөнд бүх төслийн нийлбэр */}
      {all.length > 0 ? (
        <section aria-label="Иргэдийн саналын урсгал" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {pipeline.map((p, i) => (
            <div key={p.label} className="relative rounded-2xl border border-line bg-surface p-5 shadow-card">
              <div className="flex items-center gap-2 text-[14px] font-semibold text-muted">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-action-bg text-action">
                  <p.icon aria-hidden className="h-4 w-4" />
                </span>
                {p.label}
              </div>
              <p className={`mt-3 font-serif text-[32px] font-bold tabular-nums ${i === 3 && p.value > 0 ? "text-primary" : "text-heading"}`}>
                {p.value.toLocaleString("mn-MN")}
              </p>
              <p className="mt-1 text-[13px] text-muted">{p.note}</p>
              {i < 3 ? (
                <ArrowRight aria-hidden className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-line-strong lg:block" />
              ) : null}
            </div>
          ))}
        </section>
      ) : null}

      {bills.length === 0 ? (
        <EmptyState title="Одоогоор төсөл оруулаагүй байна" description="Хүчин төгөлдөр хууль ба төслийн текстийг оруулахад заалт бүрийн харьцуулалт үүснэ." />
      ) : (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {bills.map((b) => (
            <Link key={b.id} href={`/staff/bills/${b.id}`} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-card transition-[border-color,box-shadow] hover:border-primary hover:shadow-lift">
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
