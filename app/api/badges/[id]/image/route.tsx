import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { handleError, HttpError } from "@/lib/auth";
import { getPublicBadge } from "@/lib/feed";
import { mongolianDay } from "@/lib/points";
import { badgeLabels } from "@/lib/types";

export const runtime = "nodejs";

// Тэмдгийн хуваалцах зураг (Open Graph, 1200×630), гэрчилгээний хэв маягаар.
// Монгол үсэг гарахын тулд фонтыг файлаас ачаална: PT Serif (гарчиг), Inter (текст);
// хэсэг бүр: cyrillic (кирилл), cyrillic-ext (Ө, Ү), latin (тоо).
const SUBSETS = ["cyrillic", "cyrillic-ext", "latin"] as const;
const SERIF = SUBSETS.map((s) => `PTSerif-${s}`).join(", ");
const SANS = SUBSETS.map((s) => `Inter-${s}`).join(", ");

type FontDef = { name: string; data: Buffer; weight: 400 | 700; style: "normal" };
let fontsPromise: Promise<FontDef[]> | null = null;

// Фонтыг нэг удаа уншиж санах ойд хадгална
function loadFonts() {
  const read = (file: string) => readFile(join(process.cwd(), "assets/fonts", file));
  fontsPromise ??= Promise.all(
    SUBSETS.flatMap((s) => [
      read(`pt-serif-${s}-700-normal.woff`).then((data): FontDef => ({ name: `PTSerif-${s}`, data, weight: 700, style: "normal" })),
      read(`inter-${s}-400-normal.woff`).then((data): FontDef => ({ name: `Inter-${s}`, data, weight: 400, style: "normal" })),
    ]),
  );
  return fontsPromise;
}

// "2026-09-25T..." → "2026 оны 9-р сарын 25" (Улаанбаатарын цагаар)
function mongolianDate(iso: string): string {
  const [year, month, day] = mongolianDay(new Date(iso)).split("-").map(Number);
  return `${year} оны ${month}-р сарын ${day}`;
}

function shorten(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export async function GET(_req: Request, ctx: RouteContext<"/api/badges/[id]/image">) {
  try {
    const { id } = await ctx.params;
    const badge = await getPublicBadge(id);
    if (!badge) throw new HttpError(404, "Тэмдэг олдсонгүй");

    const title = badgeLabels[badge.type].title;
    const details = [badge.clauseNumber ? `${badge.clauseNumber}-р заалт` : null, mongolianDate(badge.date)].filter(Boolean).join("  ·  ");

    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", padding: 36, backgroundColor: "#F9FAFB" }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "48px 60px",
              backgroundColor: "#FFFFFF",
              border: "2px solid #059669",
              color: "#111827",
              fontFamily: SANS,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 26, color: "#4B5563" }}>
              <div style={{ display: "flex", fontFamily: SERIF, fontSize: 34, color: "#111827" }}>Parlagmatic</div>
              <div style={{ display: "flex" }}>Иргэний нөлөөний батламж</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", fontFamily: SERIF, fontSize: 68, color: "#111827", lineHeight: 1.1 }}>{title}</div>
              <div style={{ display: "flex", width: 120, height: 3, backgroundColor: "#059669" }} />
              <div style={{ display: "flex", fontFamily: SERIF, fontSize: 48 }}>{badge.firstName}</div>
              {badge.lawTitle ? (
                <div style={{ display: "flex", fontSize: 30, color: "#374151", lineHeight: 1.35 }}>
                  {`Санал нь «${shorten(badge.lawTitle, 80)}» төсөлд тусгагдсан.`}
                </div>
              ) : null}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#4B5563" }}>
              <div style={{ display: "flex" }}>{details}</div>
              <div style={{ display: "flex" }}>Олгосон: Parlagmatic платформ</div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: await loadFonts(),
        headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
      },
    );
  } catch (e) {
    return handleError(e);
  }
}
