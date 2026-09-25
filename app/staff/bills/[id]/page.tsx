import Link from "next/link";
import { notFound } from "next/navigation";
import { getMockBill } from "@/lib/mock";
import { BillWorkbench } from "@/components/staff/bill-workbench";

// Хараахан Dev 1-ийн /api/bills/[id] бэлэн биш тул mock-с уншиж байна.
// ID нь MOCK_BILL_ID байвал mock; өөр ID ирвэл 404. Бэлэн болмогц Prisma-руу шилжинэ.
export default async function StaffBillPage({
  params,
}: PageProps<"/staff/bills/[id]">) {
  const { id } = await params;
  const bill = getMockBill(id);
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
      <BillWorkbench bill={bill} />
    </div>
  );
}
