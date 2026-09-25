import { NextResponse } from "next/server";
import { handleError, HttpError, requireStaff } from "@/lib/auth";
import { toVoteEvent, voteEventSelect } from "@/lib/feed";
import { ParliamentApiError } from "@/lib/parliament";
import { revealVoteEvent } from "@/lib/points";
import { prisma } from "@/lib/prisma";
import { findRevealCounts } from "@/lib/vote-events";

export const runtime = "nodejs";

export const maxDuration = 60;

// Ажилтан: санал хураалтын дүнг зарлаж, бүх таамгийг оноожуулна.
// Replay бол нууцалсан тоог, үгүй бол ParliamentAPI-ийн эцсийн санал хураалтыг ашиглана.
export async function POST(_req: Request, ctx: RouteContext<"/api/staff/vote-events/[id]/reveal">) {
  try {
    await requireStaff();
    const { id } = await ctx.params;

    const found = await findRevealCounts(id);
    if (found.status === "NOT_FOUND") throw new HttpError(404, "Санал хураалт олдсонгүй");
    if (found.status === "ALREADY_REVEALED") throw new HttpError(409, "Энэ санал хураалтын дүн аль хэдийн гарсан");
    if (found.status !== "OK") throw new HttpError(409, "Эцсийн хэлэлцүүлгийн санал хураалт хараахан болоогүй байна");

    const result = await revealVoteEvent(id, found.counts);
    if (!result) throw new HttpError(409, "Энэ санал хураалтын дүн аль хэдийн гарсан");

    const event = await prisma.voteEvent.findUniqueOrThrow({ where: { id }, select: voteEventSelect });
    return NextResponse.json({ event: toVoteEvent(event), ...result });
  } catch (e) {
    if (e instanceof ParliamentApiError) {
      return handleError(new HttpError(503, `${e.message}. Дараа дахин оролдоно уу — сайт хэвийн ажиллаж байна.`));
    }
    return handleError(e);
  }
}
