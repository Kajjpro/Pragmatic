// GET /api/me/comments → миний саналууд + бүлэг + хариу + тусгасан эсэх + заалтын өмнө/дараа
import { NextResponse } from "next/server";
import { requireUser, handleError } from "@/lib/auth";
import { getMyComments } from "@/lib/law/queries";

export async function GET() {
  try {
    const user = await requireUser();
    const comments = await getMyComments(user.id);
    return NextResponse.json(comments);
  } catch (e) {
    return handleError(e);
  }
}
