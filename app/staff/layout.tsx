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
        <p className="text-[17px] font-bold text-ink-950">
          Энэ хэсэг зөвхөн УИХТГ-ын ажилтанд нээлттэй.
        </p>
        <Link
          href="/"
          className="press inline-flex min-h-12 items-center rounded-full bg-point-400 px-5 text-[15px] font-bold text-ink-950 shadow-sm hover:bg-point-300"
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
    <div className="flex min-h-full flex-col bg-brand-50/30">
      <div className="chrome-brand relative text-white">
        <div className="grain" aria-hidden />
        <div className="relative mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <div>
            <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-point-400">
              Ажилтны булан
            </div>
            <h1 className="mt-0.5 text-[20px] font-bold text-white sm:text-[22px]">
              УИХ Тамгын газар · Дотоод ажлын самбар
            </h1>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-[13px] font-semibold text-white ring-1 ring-white/20 md:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Онлайн · {today}
          </div>
        </div>
      </div>
      <StaffNav />
      <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6">
        {children}
      </div>
    </div>
  );
}
