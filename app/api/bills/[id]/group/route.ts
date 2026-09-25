import { NextResponse } from "next/server";
import { handleError, HttpError, requireStaff } from "@/lib/auth";
import { groupBillComments } from "@/lib/law/grouping";
import { prisma } from "@/lib/prisma";

export const maxDuration = 300;

export async function POST(_req: Request, ctx: RouteContext<"/api/bills/[id]/group">) {
  try {
    await requireStaff();
    const { id } = await ctx.params;

    const bill = await prisma.project.findUnique({ where: { id }, select: { id: true } });
    if (!bill) throw new HttpError(404, "Төсөл олдсонгүй");

    return NextResponse.json(await groupBillComments(id));
  } catch (e) {
    return handleError(e);
  }
}
