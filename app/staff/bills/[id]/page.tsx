import Link from "next/link";
import { notFound } from "next/navigation";
import { getBillView } from "@/lib/law/queries";
import { BillWorkbench } from "@/components/staff/bill-workbench";

// Ажилтны ажлын ширээ — бодит өгөгдлөөр (өмнө нь mock уншдаг байсан).
// staff = true тул батлагдаагүй заалт, шүүгдсэн санал бүгд харагдана.
export default async function StaffBillPage({
  params,
}: PageProps<"/staff/bills/[id]">) {
  const { id } = await params;
  const bill = await getBillView(id, true);
  if (!bill) notFound();

  return (
    <div className="flex flex-col gap-5">
      <nav className="flex flex-wrap items-center gap-2 text-[13px] text-ink-600">
        <Link
          href="/staff"
          className="rounded transition-colors hover:text-brand-700"
        >
          Ажлын самбар
        </Link>
        <span aria-hidden className="text-ink-300">
          /
        </span>
        <span className="font-medium text-ink-950">{bill.title}</span>
      </nav>
      <BillWorkbench bill={bill} />
    </div>
  );
}
