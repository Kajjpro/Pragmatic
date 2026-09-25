// Иргэнд харагдах хуулийн мэдээлэл (зөвхөн уншина). Хуудсууд DB-ээс л уншина — AI дуудахгүй.
// Шат (stage) зөвхөн бодит өгөгдлөөс ирсэн үед л харуулна: LawForum-ын төсөлд seed анхдагч
// "Хэлэлцэх эсэх" тавьдаг тул тэрийг баримт мэт харуулахгүй.
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
  cards: { personas: Persona[]; kind: "BILL" | "CHANGE"; youMeaning: string }[];
  clauses: { id: string; _count: { comments: number } }[];
};

function toPublicBill(b: BillRow): PublicBill {
  const personas = Array.from(new Set(b.cards.flatMap((c) => c.personas)));
  return {
    id: b.id,
    title: b.title,
    typeTitle: b.typeTitle,
    categoryTitle: b.categoryTitle,
    stage: b.source === "UPLOAD" || b.lawforumStage !== null ? b.stage : null,
    changedCount: b.clauses.length,
    commentCount: b.clauses.reduce((sum, c) => sum + c._count.comments, 0),
    personas,
    sourceUrl: b.slugUrl,
    updatedAt: b.updatedAt.toISOString(),
  };
}

// Иргэнд харагдах төслүүд: карттай эсвэл батлагдсан харьцуулалттай
export async function getPublicBills(): Promise<PublicBill[]> {
  const rows = await prisma.project.findMany({
    where: {
      OR: [{ cards: { some: {} } }, { clauses: { some: { approved: true, changeType: { not: "UNCHANGED" } } } }],
    },
    orderBy: { updatedAt: "desc" },
    select: billSelect,
  });
  // Харьцуулалттай төслүүд эхэнд
  return rows.map(toPublicBill).sort((a, b) => b.changedCount - a.changedCount);
}

export async function getPublicBill(id: string): Promise<PublicBillDetail | null> {
  const row = await prisma.project.findUnique({
    where: { id },
    select: {
      ...billSelect,
      description: true,
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
  // Карт ч, харьцуулалт ч байхгүй төслийг иргэнд харуулахгүй
  if (row.cards.length === 0 && base.changedCount === 0) return null;

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
