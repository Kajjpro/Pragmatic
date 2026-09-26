import { NextResponse } from "next/server";
import { handleError, HttpError } from "@/lib/auth";
import { listQuery } from "@/lib/law/http";
import { listDrafts, PUBLIC_CACHE } from "@/lib/parliament-data";

export const runtime = "nodejs"; // DB хоосон бол data/snapshots-ийг fs-ээр уншина

// Нэвтрэх шаардлагагүй. LawForum-ын бүх хуулийн төсөл (LawDraft), шинээр нийтэлсэн нь эхэнд.
// /bills-ийн төслүүдээс (Project — харьцуулалт, санал авдаг) тусдаа: энэ нь эх сурвалжийн бүтэн жагсаалт.
// GET /api/drafts?q=малчны&active=1&limit=50&offset=0
//   → { source, syncedAt, total, items: [{ id, title, projectNumber, typeTitle, categoryTitle, status, stage, isActive, publishedAt, url }] }
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const active = url.searchParams.get("active");
    if (active !== null && active !== "0" && active !== "1") throw new HttpError(400, `"active" нь 0 эсвэл 1 байх ёстой`);
    const data = await listDrafts({ ...listQuery(url), active: active === "1" });
    return NextResponse.json(data, { headers: PUBLIC_CACHE });
  } catch (e) {
    return handleError(e);
  }
}
