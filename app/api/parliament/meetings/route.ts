import { NextResponse } from "next/server";
import { handleError } from "@/lib/auth";
import { listQuery } from "@/lib/law/http";
import { listMeetings, PUBLIC_CACHE } from "@/lib/parliament-data";

export const runtime = "nodejs"; // DB хоосон бол data/snapshots-ийг fs-ээр уншина

// Нэвтрэх шаардлагагүй. УИХ-ын чуулганы хуралдаанууд, шинэ нь эхэнд.
// GET /api/parliament/meetings?q=2026.06&limit=50 → { source, syncedAt, total, items: [{ id, title, description, startsAt, openedAt, endedAt }] }
export async function GET(req: Request) {
  try {
    const data = await listMeetings(listQuery(new URL(req.url)));
    return NextResponse.json(data, { headers: PUBLIC_CACHE });
  } catch (e) {
    return handleError(e);
  }
}
