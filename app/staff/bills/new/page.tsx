import Link from "next/link";
import { NewBillForm } from "@/components/staff/new-bill-form";

export default function NewBillPage() {
  return (
    <div className="flex flex-col gap-5">
      <nav className="flex items-center gap-2 text-[12px] text-ink-500">
        <Link href="/staff" className="hover:text-parliament-700">
          Миний төслүүд
        </Link>
        <span>/</span>
        <span className="text-parliament-900">Шинэ төсөл</span>
      </nav>

      <div>
        <h1 className="font-editorial text-2xl font-medium text-parliament-900">
          Шинэ төсөл оруулах
        </h1>
        <p className="mt-1 text-[13px] text-ink-500">
          Одоогийн хууль болон нэмэлт, өөрчлөлтийн төслийг оруулахад систем заалт бүрийг
          автоматаар харьцуулж, өөрчлөгдсөн үг бүрийг тодруулна.
        </p>
      </div>

      <NewBillForm />
    </div>
  );
}
