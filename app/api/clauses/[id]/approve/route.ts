// POST /api/clauses/[id]/approve  { approved?: boolean } → заалтыг батлах / цуцлах   (зөвхөн ажилтан)
import { NextResponse } from "next/server";
import { requireStaff, handleError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, ctx: RouteContext<"/api/clauses/[id]/approve">) {
  try {
    await requireStaff();
    const { id } = await ctx.params;

    // approved ирээгүй бол "батлах" гэж үзнэ
    const body = await req.json().catch(() => ({}));
    const approved = body.approved === false ? false : true;

    await prisma.clause.update({ where: { id }, data: { approved } });
    return NextResponse.json({ ok: true, approved });
  } catch (e) {
    return handleError(e);
  }
}
