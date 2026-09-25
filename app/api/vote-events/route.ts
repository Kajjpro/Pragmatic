import { NextResponse } from "next/server";
import { handleError } from "@/lib/auth";
import { getVoteEvents } from "@/lib/feed";

// Нэвтрэх шаардлагагүй. Бүх санал хураалт (OPEN, REVEALED); бодит тоо зөвхөн REVEALED үед.
export async function GET() {
  try {
    const events = await getVoteEvents();
    return NextResponse.json(events, {
      // Дүн гарсныг хурдан харуулахын тулд богино хугацаанд л хадгална
      headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=30" },
    });
  } catch (e) {
    return handleError(e);
  }
}
