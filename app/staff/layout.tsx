import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StaffNav } from "@/components/staff/staff-nav";
import { Logo } from "@/components/shell/logo";
import { buttonClass } from "@/components/ui/button";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Ажилтны хэсэг", robots: { index: false } };

// Ажилтны хэсэг: компьютер, проектор дээр уншигдахаар; үргэлж гэрэл горимд.
export default async function StaffLayout({ children }: LayoutProps<"/staff">) {
  // 1. Нэвтэрсэн хэрэглэгчийг авна
  const user = await getUser();

  // 2. Нэвтрээгүй бол нэвтрэх хуудас руу шилжүүлнэ
  if (!user) redirect("/sign-in");

  // 3. Ажилтан биш бол товч мэдэгдэл харуулна
  if (user.role !== "STAFF") {
    return (
      <div className="theme-light mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 bg-page px-6 text-center">
        <p className="text-[17px] font-semibold">Энэ хэсэг зөвхөн УИХ-ын Тамгын газрын ажилтанд нээлттэй.</p>
        <Link href="/" className={buttonClass("secondary")}>
          Нүүр хуудас руу буцах
        </Link>
      </div>
    );
  }

  return (
    <div className="theme-light flex min-h-dvh flex-col bg-page text-fg">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="hidden text-[15px] text-muted sm:inline">УИХ-ын Тамгын газар · Ажлын хэсэг</span>
          </div>
          <Link href="/" className="text-[14.5px] font-medium text-action underline underline-offset-2">
            Иргэний хэсэг
          </Link>
        </div>
      </header>
      <StaffNav />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
