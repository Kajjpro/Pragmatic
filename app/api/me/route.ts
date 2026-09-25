import { NextResponse } from "next/server";
import { handleError, requireUser } from "@/lib/auth";
import { getMe } from "@/lib/me";

// Нэвтэрсэн иргэн: оноо, streak, тэмдэг, таамаг, санал, мэдэгдэл
export async function GET() {
  try {
    const user = await requireUser(); // анх удаа бол User мөрийг үүсгэнэ
    return NextResponse.json(await getMe(user.id), { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    return handleError(e);
  }
}
