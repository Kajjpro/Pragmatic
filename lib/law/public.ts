// Иргэнд харагдах хуулийн мэдээлэл (зөвхөн уншина). Хуудсууд DB-ээс л уншина — AI дуудахгүй.
// Шат (stage) зөвхөн бодит өгөгдлөөс (демо төслийн data/stage.txt) ирсэн үед л харуулна:
// LawForum-ын "stage" дугаарын утга баталгаагүй тул манай 4 шат руу хөрвүүлж харуулахгүй.
import { prisma } from "@/lib/prisma";
import { toVoteEvent } from "@/lib/feed";
import type { Persona, VoteEvent } from "@/lib/types";
import type { Stage } from "./types";

const RELEVANT = { OR: [{ filterStatus: null }, { filterStatus: "RELEVANT" as const }] };

export type PublicBill = {
  id: string;
  title: string;
  typeTitle: string | null;
  categoryTitle: string | null;
  stage: Stage | null; // null = шат тодорхойгүй (LawForum дээр харна)
  changedCount: number;
  commentCount: number;
  personas: Persona[];
  sourceUrl: string | null;
  updatedAt: string;
  publishedAt: string | null; // LawForum-д нийтэлсэн огноо
  projectNumber: string | null;
  summary: string | null; // LawForum-ын танилцуулгын эхний хэсэг
  lawforumComments: number | null; // LawForum дээрх иргэдийн сэтгэгдлийн тоо
  lawforumViews: number | null;
  hasCard: boolean;
};

export type PublicBillDetail = PublicBill & {
  description: string | null;
  reasonText: string | null;
  cardMeaning: string | null; // энгийн тайлбар (BILL картын youMeaning)
  voteEvent: VoteEvent | null;
  commentCounts: Record<string, number>; // clauseId → хамааралтай санал
};

const billSelect = {
  id: true,
  title: true,
  typeTitle: true,
  categoryTitle: true,
  stage: true,
  source: true,
  lawforumStage: true,
  slugUrl: true,
  updatedAt: true,
  publishedAt: true,
  projectNumber: true,
  description: true,
  lawforumStats: true,
  cards: { select: { personas: true, kind: true, youMeaning: true } },
  clauses: {
    where: { changeType: { not: "UNCHANGED" as const }, approved: true },
    select: { id: true, _count: { select: { comments: { where: RELEVANT } } } },
  },
} as const;

type BillRow = {
  id: string;
  title: string;
  typeTitle: string | null;
  categoryTitle: string | null;
  stage: Stage;
  source: "LAWFORUM" | "UPLOAD";
  lawforumStage: number | null;
  slugUrl: string | null;
  updatedAt: Date;
  publishedAt: Date | null;
  projectNumber: string | null;
  description: string | null;
  lawforumStats: unknown;
  cards: { personas: Persona[]; kind: "BILL" | "CHANGE"; youMeaning: string }[];
  clauses: { id: string; _count: { comments: number } }[];
};

const SUMMARY_LENGTH = 220;

// LawForum-ын статистикаас тоо уншина (хэлбэр өөр бол null)
function statNumber(stats: unknown, key: "comments" | "hits"): number | null {
  const value = (stats as Record<string, unknown> | null)?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function firstPart(text: string | null, title: string): string | null {
  if (!text) return null;
  let clean = text.replace(/\s+/g, " ").trim();
  // LawForum-ын танилцуулга ихэвчлэн төслийн нэрийг давтаж эхэлдэг ("… ТУХАЙ ХУУЛИЙН ТӨСЛИЙН ТАНИЛЦУУЛГА") — давхардлыг хасна
  const head = title.replace(/\s+/g, " ").trim().toLowerCase();
  if (head && clean.toLowerCase().startsWith(head)) {
    clean = clean
      .slice(head.length)
      .replace(/^\s*(хуулийн төслийн танилцуулга|төслийн танилцуулга|танилцуулга)?\s*/i, "")
      .trim();
  }
  if (!clean) return null;
  return clean.length > SUMMARY_LENGTH ? `${clean.slice(0, SUMMARY_LENGTH).trimEnd()}…` : clean;
}

function toPublicBill(b: BillRow): PublicBill {
  const personas = Array.from(new Set(b.cards.flatMap((c) => c.personas)));
  return {
    id: b.id,
    title: b.title,
    typeTitle: b.typeTitle,
    categoryTitle: b.categoryTitle,
    stage: b.source === "UPLOAD" ? b.stage : null,
    changedCount: b.clauses.length,
    commentCount: b.clauses.reduce((sum, c) => sum + c._count.comments, 0),
    personas,
    sourceUrl: b.slugUrl,
    updatedAt: b.updatedAt.toISOString(),
    publishedAt: b.publishedAt ? b.publishedAt.toISOString() : null,
    projectNumber: b.projectNumber,
    summary: firstPart(b.description, b.title),
    lawforumComments: statNumber(b.lawforumStats, "comments"),
    lawforumViews: statNumber(b.lawforumStats, "hits"),
    hasCard: b.cards.length > 0,
  };
}

// Иргэнд харагдах бүх төсөл: LawForum-оос татсан бүгд + seed-ийн төслүүд.
// Эрэмбэ: заалтын харьцуулалттай → карттай → LawForum-д шинээр нийтэлсэн нь эхэнд.
export async function getPublicBills(): Promise<PublicBill[]> {
  const rows = await prisma.project.findMany({ select: billSelect });
  const time = (b: PublicBill) => new Date(b.publishedAt ?? b.updatedAt).getTime();
  return rows
    .map(toPublicBill)
    .sort((a, b) => b.changedCount - a.changedCount || Number(b.hasCard) - Number(a.hasCard) || time(b) - time(a));
}

export async function getPublicBill(id: string): Promise<PublicBillDetail | null> {
  const row = await prisma.project.findUnique({
    where: { id },
    select: {
      ...billSelect,
      reasonText: true,
      voteEvents: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          title: true,
          hook: true,
          isReplay: true,
          status: true,
          closesAt: true,
          actualSupport: true,
          actualOppose: true,
          actualTotal: true,
          passed: true,
          revealedAt: true,
          projectId: true,
          _count: { select: { predictions: true } },
        },
      },
    },
  });
  if (!row) return null;
  const base = toPublicBill(row);

  return {
    ...base,
    description: row.description,
    reasonText: row.reasonText,
    cardMeaning: row.cards.find((c) => c.kind === "BILL")?.youMeaning ?? null,
    voteEvent: row.voteEvents[0] ? toVoteEvent(row.voteEvents[0]) : null,
    commentCounts: Object.fromEntries(row.clauses.map((c) => [c.id, c._count.comments])),
  };
}

// Нүүр хуудасны жишээ: хуучин ба шинэ тексттэй, батлагдсан анхны заалт
export async function getPreviewClause() {
  return prisma.clause.findFirst({
    where: { approved: true, changeType: "CHANGED", oldText: { not: null }, newText: { not: null } },
    orderBy: { order: "asc" },
    select: {
      number: true,
      diff: true,
      oldText: true,
      newText: true,
      what: true,
      project: { select: { id: true, title: true } },
    },
  });
}

// Өөрчлөгдөөгүй заалтууд ("Зөвхөн өөрчлөгдсөнийг харуулах" унтраах үед)
export async function getUnchangedClauses(projectId: string) {
  const rows = await prisma.clause.findMany({
    where: { projectId, changeType: "UNCHANGED" },
    orderBy: { order: "asc" },
    select: { number: true, oldText: true },
  });
  return rows.filter((r) => r.oldText).map((r) => ({ number: r.number, text: r.oldText as string }));
}
