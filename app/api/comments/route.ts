import { NextResponse } from "next/server";
import { handleError, HttpError, requireUser } from "@/lib/auth";
import { readBody, str } from "@/lib/law/http";
import { prisma } from "@/lib/prisma";

const VOTES = ["SUPPORT", "OPPOSE", "NEUTRAL"] as const;

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await readBody(req);
    const clauseId = str(body, "clauseId");
    const text = str({ text: body.text ?? body.body }, "text", { min: 3, max: 1000 });

    const vote = body.vote ?? "NEUTRAL";
    if (typeof vote !== "string" || !(VOTES as readonly string[]).includes(vote)) {
      throw new HttpError(400, `"vote" нь SUPPORT, OPPOSE эсвэл NEUTRAL байх ёстой`);
    }

    const clause = await prisma.clause.findUnique({
      where: { id: clauseId },
      select: { approved: true, changeType: true, project: { select: { allowComments: true } } },
    });
    const visible =
      clause && clause.changeType !== "UNCHANGED" && (clause.approved || user.role === "STAFF");
    if (!visible) throw new HttpError(404, "Заалт олдсонгүй");
    if (!clause.project.allowComments) throw new HttpError(403, "Энэ төсөлд санал авахаа больсон");

    const comment = await prisma.comment.create({
      data: { clauseId, userId: user.id, body: text, vote: vote as (typeof VOTES)[number] },
      select: { id: true },
    });
    return NextResponse.json({ id: comment.id }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
