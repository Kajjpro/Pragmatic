import { NextResponse } from "next/server";
import { getUser, handleError, HttpError } from "@/lib/auth";
import { awardCardView } from "@/lib/points";
import { prisma } from "@/lib/prisma";
import type { CardViewResult } from "@/lib/types";

// Карт үзсэн. Нэвтэрсэн бол +1 (өдөрт нэг картад нэг удаа) ба streak.
// Нэвтрээгүй бол алдаа биш — saved: false (урсгал тасрахгүй, оноо хадгалагдахгүй).
export async function POST(_req: Request, ctx: RouteContext<"/api/cards/[id]/view">) {
  try {
    const { id } = await ctx.params;

    const card = await prisma.card.findUnique({ where: { id }, select: { id: true } });
    if (!card) throw new HttpError(404, "Карт олдсонгүй");

    const user = await getUser();
    if (!user) {
      const guest: CardViewResult = { saved: false, points: null, streak: null, pointsAwarded: 0, newBadges: [] };
      return NextResponse.json(guest);
    }

    const r = await awardCardView(user.id, card.id);
    const result: CardViewResult = { saved: true, ...r };
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
