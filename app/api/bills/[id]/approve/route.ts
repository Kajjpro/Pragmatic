import { NextResponse } from "next/server";
import { handleError, HttpError, requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, ctx: RouteContext<"/api/bills/[id]/approve">) {
  try {
    await requireStaff();
    const { id } = await ctx.params;

    const bill = await prisma.project.findUnique({ where: { id }, select: { id: true } });
    if (!bill) throw new HttpError(404, "Төсөл олдсонгүй");

    const changed = { projectId: id, changeType: { not: "UNCHANGED" as const } };
    const [ok, needsCheck] = await Promise.all([
      prisma.clause.updateMany({
        where: { ...changed, applyError: false },
        data: { approved: true },
      }),
      prisma.clause.count({ where: { ...changed, applyError: true, approved: false } }),
    ]);

    return NextResponse.json({ approved: ok.count, needsCheck });
  } catch (e) {
    return handleError(e);
  }
}
