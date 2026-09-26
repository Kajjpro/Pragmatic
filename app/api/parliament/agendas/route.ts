import { NextResponse } from "next/server";
import { handleError } from "@/lib/auth";
import { listQuery } from "@/lib/law/http";
import { listAgendas, PUBLIC_CACHE } from "@/lib/parliament-data";

export const runtime = "nodejs"; // DB хоосон бол data/snapshots-ийг fs-ээр уншина

// Нэвтрэх шаардлагагүй. УИХ-ын хэлэлцэх асуудлууд, сүүлд санал хураасан нь эхэнд.
// GET /api/parliament/agendas?q=татвар&limit=50&offset=0
//   → { source: "db" | "snapshot", syncedAt, total, items: [{ agendaCode, title, voteCount, lastVotedAt, finalVote }] }
export async function GET(req: Request) {
  try {
    const data = await listAgendas(listQuery(new URL(req.url)));
    return NextResponse.json(data, { headers: PUBLIC_CACHE });
  } catch (e) {
    return handleError(e);
  }
}
