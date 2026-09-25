// POST /api/comments/[id]/restore → шүүгдсэн саналыг буцааж RELEVANT болгоно   (зөвхөн ажилтан)
// Дараагийн "Санал бүлэглэх" үед энэ санал бүлэгт орно.
import { NextResponse } from "next/server";
import { requireStaff, handleError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, ctx: RouteContext<"/api/comments/[id]/restore">) {
  try {
    await requireStaff();
    const { id } = await ctx.params;

    await prisma.comment.update({
      where: { id },
      data: { filterStatus: "RELEVANT", filterReason: null, clusterId: null },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
