import { NextResponse } from "next/server";
import { handleError, requireUser } from "@/lib/auth";
import { getMyComments } from "@/lib/law/queries";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json(await getMyComments(user.id));
  } catch (e) {
    return handleError(e);
  }
}
