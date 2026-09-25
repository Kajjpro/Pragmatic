import Link from "next/link";
import { StatusPill } from "@/components/ui/status-pill";
import { stageLabels } from "@/lib/labels";
import type { BillSummary } from "@/lib/law/queries";

// Нүүр хуудасны төслийн карт — тоонууд нь BillSummary-гаас (бодит).
export function BillCard({ bill }: { bill: BillSummary }) {
  return (
    <Link
      href={`/bills/${bill.id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-5 shadow-[0_20px_45px_-30px_rgba(15,42,99,0.3)] transition hover:-translate-y-0.5 hover:border-parliament-200 hover:shadow-[0_25px_55px_-30px_rgba(15,42,99,0.45)]"
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone="info">{stageLabels[bill.stage]}</StatusPill>
        {bill.commentCount > 0 ? (
          <StatusPill tone="good">Санал хүлээж байна</StatusPill>
        ) : null}
      </div>

      <h3 className="font-editorial text-[16px] font-medium leading-snug text-ink-900 group-hover:text-parliament-900">
        {bill.title}
      </h3>

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-ink-100 pt-3 text-[11.5px] text-ink-500">
        <span>
          <b className="text-parliament-700">{bill.changedCount}</b> өөрчлөлт
        </span>
        <span>
          <b className="text-parliament-700">{bill.commentCount}</b> санал
        </span>
        <span className="ml-auto font-semibold text-parliament-700 group-hover:text-parliament-900">
          Санал өгөх →
        </span>
      </div>
    </Link>
  );
}
