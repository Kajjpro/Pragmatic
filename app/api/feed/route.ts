import { NextResponse, type NextRequest } from "next/server";
import { handleError, HttpError } from "@/lib/auth";
import { getFeed, isPersona } from "@/lib/feed";
import { PERSONAS } from "@/lib/types";

// Нэвтрэх шаардлагагүй. ?persona=STUDENT|DRIVER|WORKER|PARENT|ALL (өгөөгүй бол ALL)
export async function GET(req: NextRequest) {
  try {
    const persona = req.nextUrl.searchParams.get("persona") ?? "ALL";
    if (!isPersona(persona)) {
      throw new HttpError(400, `"persona" нь ${PERSONAS.join(", ")} дотроос байх ёстой`);
    }

    const cards = await getFeed(persona);
    return NextResponse.json(cards, {
      // Картууд seed-ээр л өөрчлөгддөг тул CDN 1 минут хадгална
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600" },
    });
  } catch (e) {
    return handleError(e);
  }
}
