import Link from "next/link";
import { notFound } from "next/navigation";
import { getMockBill } from "@/lib/mock";
import { getBillDetail } from "@/lib/law/queries";
import { BillWorkbench } from "@/components/staff/bill-workbench";

// DB-ээс уншина (AI урсгалаар оруулсан төсөл). Демо mock ID ирвэл mock-ийг харуулна.
export default async function StaffBillPage({
  params,
}: PageProps<"/staff/bills/[id]">) {
  const { id } = await params;
  const mock = getMockBill(id);
  const bill = mock ?? (await getBillDetail(id, true));
  if (!bill) notFound();

  return (
    <div className="flex flex-col gap-5">
      <nav className="flex items-center gap-2 text-[12px] text-ink-500">
        <Link href="/staff" className="hover:text-parliament-700">
          Ажлын самбар
        </Link>
        <span>/</span>
        <span className="text-parliament-900">{bill.title}</span>
      </nav>
      <BillWorkbench bill={bill} live={mock === null} />
    </div>
  );
}
