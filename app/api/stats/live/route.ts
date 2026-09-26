import { NextResponse } from "next/server";
import { getLiveStats } from "@/lib/stats";

export const runtime = "nodejs";

// GET /api/stats/live → { agendaCount, draftCount, lastVoteDate, citizenComments, recentVotes, recentDrafts, updatedAt }
// Утга бүр null байж болно (эх сурвалж хүрэхгүй бол) — хуудас тэрийг нуух ёстой.
export async function GET() {
  return NextResponse.json(await getLiveStats());
}
