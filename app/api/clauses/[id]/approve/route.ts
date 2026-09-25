import { NextResponse } from "next/server";
import { handleError, HttpError, requireStaff } from "@/lib/auth";
import { readBody } from "@/lib/law/http";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, ctx: RouteContext<"/api/clauses/[id]/approve">) {
  try {
    await requireStaff();
    const { id } = await ctx.params;

    const body = await readBody(req).catch(() => ({}) as Record<string, unknown>);
    if (body.approved !== undefined && typeof body.approved !== "boolean") {
      throw new HttpError(400, `"approved" нь true/false байх ёстой`);
    }
    const approved = body.approved ?? true;

    const clause = await prisma.clause
      .update({ where: { id }, data: { approved: approved as boolean }, select: { id: true, approved: true } })
      .catch(() => null);
    if (!clause) throw new HttpError(404, "Заалт олдсонгүй");

    return NextResponse.json(clause);
  } catch (e) {
    return handleError(e);
  }
}
