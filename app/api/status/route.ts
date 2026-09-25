import { NextResponse } from "next/server";
import { getSourceStatus } from "@/lib/status";

export const runtime = "nodejs";

// GET /api/status → { parliament: "online" | "offline" | "unconfigured", checkedAt }
export async function GET() {
  return NextResponse.json(await getSourceStatus(), { headers: { "Cache-Control": "public, max-age=60" } });
}
