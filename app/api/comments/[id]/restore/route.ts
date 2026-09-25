import { NextResponse } from "next/server";
import { handleError, HttpError, requireStaff } from "@/lib/auth";
import { restoreComment } from "@/lib/law/queries";

export async function POST(_req: Request, ctx: RouteContext<"/api/comments/[id]/restore">) {
  try {
    await requireStaff();
    const { id } = await ctx.params;

    const result = await restoreComment(id);
    if (!result) throw new HttpError(404, "Санал олдсонгүй");
    if (!result.restored) throw new HttpError(400, "Энэ санал шүүгдээгүй байна");

    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
