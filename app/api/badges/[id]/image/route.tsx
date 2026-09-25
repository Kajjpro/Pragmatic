import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { handleError, HttpError } from "@/lib/auth";
import { getPublicBadge } from "@/lib/feed";
import { mongolianDay } from "@/lib/points";
import { badgeLabels } from "@/lib/types";

// Тэмдгийн хуваалцах зураг (Open Graph, 1200×630).
// Монгол үсэг гарахын тулд Manrope-ийн 3 хэсгийг ачаална: cyrillic (кирилл), cyrillic-ext (Ө, Ү), latin (тоо).
// Хэсэг бүр тусдаа нэртэй — тэгэхгүй бол 800 жинтэй текст 500 жинтэй фонт руу унана.
const SUBSETS = ["cyrillic", "cyrillic-ext", "latin"] as const;
const FONT_FAMILY = SUBSETS.map((s) => `Manrope-${s}`).join(", ");

// Фонтыг нэг л удаа уншиж санах ойд хадгална
let fontsPromise: Promise<{ name: string; data: Buffer; weight: 500 | 800; style: "normal" }[]> | null = null;
function loadFonts() {
  fontsPromise ??= Promise.all(
    SUBSETS.flatMap((subset) =>
      ([500, 800] as const).map(async (weight) => ({
        name: `Manrope-${subset}`,
        data: await readFile(join(process.cwd(), "assets/fonts", `manrope-${subset}-${weight}-normal.woff`)),
        weight,
        style: "normal" as const,
      })),
    ),
  );
  return fontsPromise;
}

// "2026-09-25T..." → "2026 оны 9-р сарын 25" (Улаанбаатарын цагаар)
function mongolianDate(iso: string): string {
  const [year, month, day] = mongolianDay(new Date(iso)).split("-").map(Number);
  return `${year} оны ${month}-р сарын ${day}`;
}

// Урт хуулийн нэрийг таслана (зураг дээр 2 мөрөнд багтах)
function shorten(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export async function GET(_req: Request, ctx: RouteContext<"/api/badges/[id]/image">) {
  try {
    const { id } = await ctx.params;
    const badge = await getPublicBadge(id);
    if (!badge) throw new HttpError(404, "Тэмдэг олдсонгүй");

    const title = badgeLabels[badge.type].title;
    const details = [badge.clauseNumber ? `${badge.clauseNumber} дэх заалт` : null, mongolianDate(badge.date)]
      .filter(Boolean)
      .join("  ·  ");

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 72px",
            backgroundImage: "linear-gradient(135deg, #4c1d95 0%, #2e1065 100%)",
            color: "#ffffff",
            fontFamily: FONT_FAMILY,
          }}
        >
          {/* Лого */}
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                backgroundColor: "#7c3aed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 38,
                fontWeight: 800,
              }}
            >
              Х
            </div>
            <div style={{ fontSize: 40, fontWeight: 800 }}>Хариу</div>
          </div>

          {/* Тэмдэг ба нэр */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 76, fontWeight: 800, color: "#fbbf24", lineHeight: 1.05 }}>{title}</div>
            <div style={{ fontSize: 56, fontWeight: 800 }}>{badge.firstName}</div>
            {badge.lawTitle ? (
              <div style={{ fontSize: 34, fontWeight: 500, color: "#ddd6fe", lineHeight: 1.3 }}>
                {shorten(badge.lawTitle, 90)}
              </div>
            ) : null}
          </div>

          {/* Заалт, огноо */}
          <div style={{ display: "flex", fontSize: 30, fontWeight: 500, color: "#c4b5fd" }}>{details}</div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: await loadFonts(),
        headers: {
          // Тэмдэг өөрчлөгддөггүй тул CDN удаан хадгална
          "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch (e) {
    return handleError(e);
  }
}
