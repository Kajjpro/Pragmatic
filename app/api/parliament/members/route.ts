import { NextResponse } from "next/server";
import { handleError } from "@/lib/auth";
import { listQuery } from "@/lib/law/http";
import { listMembers, PUBLIC_CACHE } from "@/lib/parliament-data";

export const runtime = "nodejs"; // DB хоосон бол data/snapshots-ийг fs-ээр уншина

// Нэвтрэх шаардлагагүй. УИХ-ын гишүүд (нэр, имэйл) — ParliamentAPI энэ эрхээр хоосон жагсаалт өгдөг тул одоо items = [].
// Гишүүдийг эрэмбэлэх, санал өгсөн байдлаар нь харуулахгүй (CLAUDE.md: төвийг сахих).
// GET /api/parliament/members?q=нэр → { source, syncedAt, total, items: [{ key, name, email }] }
export async function GET(req: Request) {
  try {
    const data = await listMembers(listQuery(new URL(req.url), 200));
    return NextResponse.json(data, { headers: PUBLIC_CACHE });
  } catch (e) {
    return handleError(e);
  }
}
