import { NextResponse } from "next/server";
import { handleError, HttpError } from "@/lib/auth";
import { getPublicBadge } from "@/lib/feed";

// Нэвтрэх шаардлагагүй — хуваалцах хуудас. Зөвхөн нэр (эхний үг), хууль, заалт, огноо.
export async function GET(_req: Request, ctx: RouteContext<"/api/badges/[id]">) {
  try {
    const { id } = await ctx.params;
    const badge = await getPublicBadge(id);
    if (!badge) throw new HttpError(404, "Тэмдэг олдсонгүй");

    return NextResponse.json(badge, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (e) {
    return handleError(e);
  }
}
