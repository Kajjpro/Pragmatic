import { NextResponse } from "next/server";
import { handleError, HttpError, requireStaff } from "@/lib/auth";
import { ParliamentApiError } from "@/lib/parliament";
import { syncVoteEvents } from "@/lib/vote-events";

export const runtime = "nodejs";
export const maxDuration = 60; // ParliamentAPI-аас олон асуудал татна

// Ажилтан: ParliamentAPI → VoteEvent. API унасан бол 503, сайт DB-ээс ажилласаар байна.
export async function POST() {
  try {
    await requireStaff();
    return NextResponse.json(await syncVoteEvents());
  } catch (e) {
    if (e instanceof ParliamentApiError) {
      return handleError(new HttpError(503, `${e.message}. Одоо байгаа санал хураалтууд хэвээр ажиллана.`));
    }
    return handleError(e);
  }
}
