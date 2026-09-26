import { NextResponse } from "next/server";
import { handleError, HttpError } from "@/lib/auth";
import { getMeeting, PUBLIC_CACHE } from "@/lib/parliament-data";

export const runtime = "nodejs"; // DB хоосон бол data/snapshots-ийг fs-ээр уншина

// Нэвтрэх шаардлагагүй. Нэг хуралдаан ба түүнд болсон санал хураалтууд (зөвхөн тоо).
// GET /api/parliament/meetings/657 → { source, syncedAt, meeting, votes }
export async function GET(_req: Request, ctx: RouteContext<"/api/parliament/meetings/[id]">) {
  try {
    const { id } = await ctx.params;
    const meetingId = Number(id);
    if (!/^\d+$/.test(id) || !Number.isSafeInteger(meetingId)) throw new HttpError(400, "Хуралдааны дугаар бүхэл тоо байх ёстой");
    const data = await getMeeting(meetingId);
    if (!data) throw new HttpError(404, "Хуралдаан олдсонгүй");
    return NextResponse.json(data, { headers: PUBLIC_CACHE });
  } catch (e) {
    return handleError(e);
  }
}
