import { NextResponse } from "next/server";
import { handleError } from "@/lib/auth";
import { getCommentTargets } from "@/lib/comment-targets";

// Нэвтрэх шаардлагагүй: санал авч буй төсөл, заалтын жагсаалт
export async function GET() {
  try {
    return NextResponse.json(await getCommentTargets(), {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
    });
  } catch (e) {
    return handleError(e);
  }
}
