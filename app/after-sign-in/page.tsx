import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

// Нэвтэрсний дараа: ажилтан бол шууд /staff, иргэн бол нэвтрэхээсээ өмнөх хуудас руугаа (?next=).
// getUser() хэрэглэгчийг үүсгэж, ажилтны эрхийг (имэйлээр) шалгана.
export default async function AfterSignInPage({ searchParams }: PageProps<"/after-sign-in">) {
  const user = await getUser();
  if (!user) redirect("/sign-in");
  if (user.role === "STAFF") redirect("/staff");

  const { next } = await searchParams;
  // Зөвхөн сайтын доторх зам (гадны холбоос руу шилжүүлэхгүй)
  const safe = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  redirect(safe);
}
