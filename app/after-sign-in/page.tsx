import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

// Нэвтэрсний дараа: ажилтан бол шууд /staff, иргэн бол нүүр хуудас.
// getUser() хэрэглэгчийг үүсгэж, ажилтны эрхийг (имэйлээр) шалгана.
export default async function AfterSignInPage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");
  redirect(user.role === "STAFF" ? "/staff" : "/");
}
