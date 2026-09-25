// POST /api/bills/[id]/group → шинэ саналуудыг шүүх → бүлэглэх → хариуны ноорог   (зөвхөн ажилтан)
import { NextResponse } from "next/server";
import { requireStaff, handleError } from "@/lib/auth";
import { groupBillComments } from "@/lib/law/pipeline";

export async function POST(_req: Request, ctx: RouteContext<"/api/bills/[id]/group">) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    const result = await groupBillComments(id);
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
