// POST /api/groups/[id]/reply  { replyText, reflection } → хариуг хадгалж, Тусгасан/Тусгаагүй тэмдэглэнэ   (зөвхөн ажилтан)
import { NextResponse } from "next/server";
import { requireStaff, handleError, HttpError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const REFLECTIONS = ["PENDING", "REFLECTED", "NOT_REFLECTED"] as const;

export async function POST(req: Request, ctx: RouteContext<"/api/groups/[id]/reply">) {
  try {
    const staff = await requireStaff();
    const { id } = await ctx.params;
    const body = await req.json();

    // 1. Оролтыг шалгана
    const replyText = typeof body.replyText === "string" ? body.replyText.trim() : "";
    const reflection = REFLECTIONS.includes(body.reflection) ? body.reflection : "PENDING";
    if (replyText === "") {
      throw new HttpError(400, "Хариуны текстийг оруулна уу");
    }

    // 2. Хариуг хадгална (байхгүй бол үүсгэнэ)
    await prisma.reply.upsert({
      where: { clusterId: id },
      update: { finalText: replyText, reflection, approvedById: staff.id, approvedAt: new Date() },
      create: { clusterId: id, finalText: replyText, reflection, approvedById: staff.id, approvedAt: new Date() },
    });

    // 3. Бүлгийг "хариулсан" болгоно
    await prisma.cluster.update({ where: { id }, data: { status: "ANSWERED" } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
