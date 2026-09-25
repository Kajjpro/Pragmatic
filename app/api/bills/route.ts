// GET  /api/bills  → BillSummary[] (ажилтны оруулсан төслүүд)
// POST /api/bills  → { title, stage, currentLawText, amendmentText, reasonText } → AI урсгал → { id }   (зөвхөн ажилтан)
import { NextResponse } from "next/server";
import { requireStaff, handleError, HttpError } from "@/lib/auth";
import { createBill } from "@/lib/law/pipeline";
import { listBillSummaries } from "@/lib/law/queries";
import type { Stage } from "@/lib/mock";

const STAGES: Stage[] = ["DISCUSS_DECISION", "FIRST_READING", "FINAL_READING", "FINAL_APPROVAL"];

export async function GET() {
  try {
    const bills = await listBillSummaries();
    return NextResponse.json(bills);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireStaff();
    const body = await req.json();

    // 1. Оролтыг шалгана
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const currentLawText = typeof body.currentLawText === "string" ? body.currentLawText.trim() : "";
    const amendmentText = typeof body.amendmentText === "string" ? body.amendmentText.trim() : "";
    const reasonText = typeof body.reasonText === "string" ? body.reasonText.trim() : "";
    const stage: Stage = STAGES.includes(body.stage) ? body.stage : "FIRST_READING";

    if (title === "") throw new HttpError(400, "Төслийн нэрийг оруулна уу");
    if (currentLawText === "") throw new HttpError(400, "Одоогийн хуулийн текстийг оруулна уу");
    if (amendmentText === "") throw new HttpError(400, "Нэмэлт, өөрчлөлтийн төслийн текстийг оруулна уу");

    // 2. AI урсгал: хуваах → ойлгох → засах → харьцуулах → тайлбарлах → DB
    const id = await createBill({ title, stage, currentLawText, amendmentText, reasonText });
    return NextResponse.json({ id });
  } catch (e) {
    return handleError(e);
  }
}
