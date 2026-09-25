// POST /api/comments  { clauseId, body }
// Иргэний саналыг DB-руу хадгална. Нэвтэрсэн байх шаардлагатай.
import { NextResponse } from "next/server";
import { requireUser, handleError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { clauseId, body } = await req.json();

    if (!clauseId || typeof clauseId !== "string") {
      return NextResponse.json({ error: "Заалт байхгүй байна" }, { status: 400 });
    }
    const text = typeof body === "string" ? body.trim() : "";
    if (text.length < 3) {
      return NextResponse.json(
        { error: "Санал хэтэрхий богино байна" },
        { status: 400 },
      );
    }
    if (text.length > 1000) {
      return NextResponse.json(
        { error: "Санал 1000 тэмдэгтээс хэтэрч болохгүй" },
        { status: 400 },
      );
    }

    const clause = await prisma.clause.findUnique({
      where: { id: clauseId },
      select: { id: true, project: { select: { allowComments: true } } },
    });
    if (!clause) {
      return NextResponse.json({ error: "Заалт олдсонгүй" }, { status: 404 });
    }
    if (!clause.project.allowComments) {
      return NextResponse.json(
        { error: "Энэ хуульд санал авахыг хаасан байна" },
        { status: 403 },
      );
    }

    const comment = await prisma.comment.create({
      data: {
        clauseId,
        userId: user.id,
        body: text,
        source: "WEB",
      },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, comment });
  } catch (e) {
    return handleError(e);
  }
}
