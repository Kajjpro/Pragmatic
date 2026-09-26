import { NextResponse } from "next/server";
import { handleError, HttpError } from "@/lib/auth";
import { getAgenda, PUBLIC_CACHE } from "@/lib/parliament-data";

export const runtime = "nodejs"; // DB хоосон бол data/snapshots-ийг fs-ээр уншина

// Нэвтрэх шаардлагагүй. Нэг хэлэлцэх асуудал ба бүх санал хураалт (зөвхөн тоо), цагийн дарааллаар.
// GET /api/parliament/agendas/20250200075 → { source, syncedAt, agenda, votes }
export async function GET(_req: Request, ctx: RouteContext<"/api/parliament/agendas/[code]">) {
  try {
    const { code } = await ctx.params;
    if (!/^\d{11}$/.test(code)) throw new HttpError(400, "Хэлэлцэх асуудлын код 11 оронтой тоо байх ёстой");
    const data = await getAgenda(code);
    if (!data) throw new HttpError(404, "Хэлэлцэх асуудал олдсонгүй");
    return NextResponse.json(data, { headers: PUBLIC_CACHE });
  } catch (e) {
    return handleError(e);
  }
}
