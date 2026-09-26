// LawForum-ын БҮХ идэвхтэй төслийг манай DB руу татна (Project хүснэгт).
// Хуудсууд DB-ээс уншдаг тул энэ нь /bills дээр бүх бодит төслийг харуулна.
//
// Логик:
//   - Зөвхөн isActive төслийг авна (нийтэд нээлттэй).
//   - lawforumId эсвэл LawForum-ын хаягаар тулгана → давхардахгүй (seed-ийн демо төсөл ч).
//   - Seed-ийн өгөгдлийг (харьцуулалт, карт, демо шат, текстүүд) ДАРЖ БИЧИХГҮЙ:
//     аль хэдийн байгаа төсөлд зөвхөн LawForum-ын мета мэдээллийг шинэчилнэ.
//   - LawForum-ын "stage" дугаарын утга баталгаагүй тул манай 4 шат руу хөрвүүлэхгүй.
import { getAllProjects, getProject, lawforumDate, lawforumPageUrl, type ProjectDetail, type ProjectListItem } from "@/lib/lawforum";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";

const CONCURRENCY = 6; // LawForum-ыг ачаалахгүйн тулд зэрэг 6 хүсэлт

// HTML тайлбарыг цэвэр текст болгоно (мөр шилжилтийг хадгална)
export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/(p|div|li|h\d)>|<br\s*\/?>/gi, "\n")
    .replace(/<\/?(b|i|u|em|strong|span|a)(\s[^>]*)?>/gi, "") // үгийн доторх тэмдэглэгээ — зай үлдээхгүй
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type SyncProjectsReport = {
  fetched: number; // LawForum-оос ирсэн нийт
  active: number; // үүнээс идэвхтэй
  created: number;
  updated: number;
  detailFailed: number; // дэлгэрэнгүйг авч чадаагүй (жагсаалтын мэдээллээр хадгалсан)
};

async function saveOne(item: ProjectListItem, detail: ProjectDetail | null): Promise<"created" | "updated" | "skipped"> {
  const title = (detail?.title ?? item.title ?? "").trim();
  if (!title) return "skipped";

  const url = lawforumPageUrl(item.id);
  const description = detail?.description ? stripHtml(detail.description) || null : null;

  // LawForum-ын мета мэдээлэл (бүх төсөлд шинэчилнэ)
  const meta = {
    projectNumber: detail?.projectNumber ?? item.projectNumber ?? null,
    typeTitle: detail?.typeTitle ?? item.typeTitle ?? null,
    categoryTitle: detail?.categoryTitle ?? item.categoryTitle ?? null,
    status: item.status,
    lawforumStage: item.stage,
    publishedAt: lawforumDate(item.publishedOnUtc),
    ...(detail ? { allowComments: detail.isAllowComments, lawforumStats: detail.statistics ?? undefined } : {}),
  };

  const existing = await prisma.project.findFirst({
    where: { OR: [{ lawforumId: item.id }, { slugUrl: url }] },
    select: { id: true, source: true, description: true },
  });

  if (existing) {
    await prisma.project.update({
      where: { id: existing.id },
      data: {
        ...meta,
        lawforumId: item.id,
        // Seed-ийн (UPLOAD) төслийн нэр, тайлбарыг хадгална; LawForum-ын төсөлд шинэчилнэ
        ...(existing.source === "LAWFORUM" ? { title, ...(description ? { description } : {}) } : {}),
        ...(!existing.description && description ? { description } : {}),
      },
    });
    return "updated";
  }

  await prisma.project.create({
    data: { ...meta, lawforumId: item.id, title, description, slugUrl: url, source: "LAWFORUM" },
  });
  return "created";
}

// withDetails=false: зөвхөн жагсаалтаар хурдан хадгална (нэг хүсэлт) — анх удаа хуудсыг хоосон харуулахгүйн тулд.
export async function syncLawforumProjects({ withDetails = true } = {}): Promise<SyncProjectsReport> {
  const all = await getAllProjects();
  const active = all.filter((p) => p.isActive);
  const report: SyncProjectsReport = { fetched: all.length, active: active.length, created: 0, updated: 0, detailFailed: 0 };

  // Цөөн зэрэгцээ хүсэлтээр дэлгэрэнгүйг авч хадгална
  for (let i = 0; i < active.length; i += CONCURRENCY) {
    const batch = active.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (item) => {
        const detail = withDetails ? await getProject(item.id).catch(() => null) : null;
        if (withDetails && !detail) report.detailFailed++;
        const result = await saveOne(item, detail);
        if (result === "created") report.created++;
        if (result === "updated") report.updated++;
      }),
    );
  }
  return report;
}

// ───────────── Автомат шинэчлэл ─────────────
// /bills нээгдэх бүрд дуудна. Хэн нэгэн гараар sync хийхийг хүлээхгүй:
//   - LawForum-оос нэг ч удаа татаагүй бол (зөвхөн seed-ийн төслүүд) → жагсаалтыг ДОР НЬ татаж хадгална (хуудас хоосон гарахгүй),
//     дэлгэрэнгүйг (танилцуулга, статистик) хариу илгээсний дараа цаана нь татна.
//   - 6 цагаас хуучин бол → хэрэглэгчийг хүлээлгэхгүй, цаана нь шинэчилнэ.
//   - LawForum унасан бол DB-д байгаагаар нь харуулна.
const STALE_MS = 6 * 60 * 60 * 1000;
let running: Promise<unknown> | null = null; // нэг сервер дээр давхар sync эхлүүлэхгүй

function runOnce(task: () => Promise<unknown>): Promise<unknown> {
  running ??= task()
    .catch((error) => console.error("LawForum sync амжилтгүй:", error))
    .finally(() => {
      running = null;
    });
  return running;
}

export type FreshnessResult = "ok" | "lawforum-unreachable";

export async function ensureProjectsFresh(): Promise<FreshnessResult> {
  // lawforumStage-г зөвхөн энэ sync бөглөдөг (seed бөглөдөггүй) → sync огт хийгдсэн эсэхийн тэмдэг
  const latest = await prisma.project.findFirst({
    where: { lawforumStage: { not: null } },
    orderBy: { updatedAt: "desc" },
    select: { updatedAt: true },
  });

  if (!latest) {
    try {
      await syncLawforumProjects({ withDetails: false });
    } catch (error) {
      console.error("LawForum-оос төсөл татаж чадсангүй:", error);
      return "lawforum-unreachable";
    }
    after(() => runOnce(() => syncLawforumProjects()));
    return "ok";
  }

  if (Date.now() - latest.updatedAt.getTime() > STALE_MS) {
    after(() => runOnce(() => syncLawforumProjects()));
  }
  return "ok";
}
