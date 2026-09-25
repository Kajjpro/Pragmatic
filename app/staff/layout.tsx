import Link from "next/link";
import { redirect } from "next/navigation";
import { StaffNav } from "@/components/staff/staff-nav";
import { getUser } from "@/lib/auth";

export default async function StaffLayout({ children }: LayoutProps<"/staff">) {
  // 1. Нэвтэрсэн хэрэглэгчийг авна
  const user = await getUser();

  // 2. Нэвтрээгүй бол нэвтрэх хуудас руу шилжүүлнэ
  if (!user) redirect("/sign-in");

  // 3. Ажилтан биш бол товч мэдэгдэл харуулна
  if (user.role !== "STAFF") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-20 text-center">
        <p className="text-[15px] font-semibold text-parliament-900">
          Энэ хэсэг зөвхөн УИХТГ-ын ажилтанд нээлттэй.
        </p>
        <Link
          href="/"
          className="rounded-full bg-parliament-700 px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-parliament-800"
        >
          Нүүр хуудас руу буцах
        </Link>
      </div>
    );
  }

  // 4. Өнөөдрийн огноо (Улаанбаатарын цагаар, 2026-09-25 хэлбэрээр)
  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Ulaanbaatar",
  });

  return (
    <div className="flex min-h-full flex-col bg-parliament-50/30">
      <div className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-parliament-500">
              Ажилтны булан
            </div>
            <h1 className="text-lg font-bold text-parliament-900">
              УИХ Тамгын газар · Дотоод ажлын самбар
            </h1>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-parliament-50 px-3 py-1.5 text-[11.5px] font-semibold text-parliament-800 md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Онлайн · {today}
          </div>
        </div>
      </div>
      <StaffNav />
      <div className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-6">
        {children}
      </div>
    </div>
  );
}
