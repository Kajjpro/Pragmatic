import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { handleError, HttpError, requireStaff } from "@/lib/auth";
import { syncLawforumProjects } from "@/lib/lawforum-sync";

export const runtime = "nodejs";
export const maxDuration = 60; // олон төслийн дэлгэрэнгүйг татна

// Ажилтан: LawForum → Project. LawForum хүрэхгүй бол 503, сайт DB-ээс ажилласаар байна.
export async function POST() {
  try {
    await requireStaff();
    let report;
    try {
      report = await syncLawforumProjects();
    } catch {
      throw new HttpError(503, "LawForum-тай холбогдож чадсангүй. Түр хүлээгээд дахин оролдоно уу.");
    }
    revalidatePath("/bills");
    return NextResponse.json(report);
  } catch (e) {
    return handleError(e);
  }
}
