// Нэвтрээгүй хүн ч харах өгөгдөл: картууд, санал хураалтууд, тэмдгийн хуваалцах мэдээлэл.
// AI хэзээ ч дуудахгүй — зөвхөн DB-ээс уншина.
import { ensureCards, ensureVoteEvents, readPrecomputed } from "@/lib/bootstrap";
import { listAgendas } from "@/lib/parliament-data";
import { prisma } from "@/lib/prisma";
import { PERSONAS, type BillKind, type FeedCard, type Persona, type PublicBadge, type VoteEvent } from "@/lib/types";
import type { WordPart } from "@/lib/law/types";

export function isPersona(v: unknown): v is Persona {
  return typeof v === "string" && (PERSONAS as readonly string[]).includes(v);
}

// QuizQuestion.options нь Json багана — зөвхөн текстүүдийг үлдээнэ
export function toOptions(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((o): o is string => typeof o === "string") : [];
}

// ───────────── Картууд ─────────────

// Төслийн төрлийг гарчиг, танилцуулгын эхнээс нь (зөвхөн төслийн өөрийн үгээр) тодорхойлно.
// Картын «Одоо ийм байсан» хэсэгт хэрэглэнэ — таамаглахгүй, олдохгүй бол null.
export function billKindOf(title: string, description: string | null): BillKind | null {
  const head = `${title}\n${(description ?? "").slice(0, 400)}`.toLowerCase();
  if (head.includes("шинэчилсэн найруулга")) return "REVISION";
  if (head.includes("нэмэлт") || head.includes("өөрчлөлт оруулах")) return "AMENDMENT";
  if (head.includes("анхдагч хуулийн төсөл")) return "NEW";
  return null;
}

// ALL = бүх карт. Бусад үед тэр хүмүүст эсвэл бүгдэд (ALL) зориулсан картууд.
// Асуултын зөв хариу, тайлбарыг энд ЯВУУЛАХГҮЙ.
// DB хоосон бол precomputed.json-оос нэг удаа бөглөнө. DB огт хүрэхгүй бол файлаас шууд уншина.
export async function getFeed(persona: Persona): Promise<FeedCard[]> {
  try {
    await ensureCards();
    return await getFeedFromDb(persona);
  } catch (error) {
    console.error("Картыг DB-ээс уншиж чадсангүй, data/precomputed.json-оос уншина:", error instanceof Error ? error.message : error);
    return getFeedFromFile(persona);
  }
}

// «demo-» id: DB-гүй үеийн карт, асуулт (оноо хадгалагдахгүй)
export const DEMO_PREFIX = "demo-";

export function getFeedFromFile(persona: Persona): FeedCard[] {
  const data = readPrecomputed();
  const billTitle = new Map(data.bills.map((b) => [b.key, b.title]));
  return data.cards
    .filter((c) => persona === "ALL" || c.personas.includes(persona) || c.personas.includes("ALL"))
    .sort((a, b) => a.order - b.order)
    .map((c) => ({
      id: `${DEMO_PREFIX}${c.key}`,
      kind: c.kind,
      emoji: c.emoji,
      hook: c.hook,
      before: c.before ?? null,
      after: c.after ?? null,
      youMeaning: c.youMeaning,
      sourceQuote: c.sourceQuote ?? null,
      personas: c.personas.filter(isPersona),
      sourceUrl: c.sourceUrl,
      order: c.order,
      projectId: null,
      clauseId: null,
      projectTitle: billTitle.get(c.projectKey) ?? null,
      quiz: c.quiz.map((q, i) => ({ id: `${DEMO_PREFIX}${c.key}~${i}`, question: q.question, options: q.options })),
    }));
}

// «demo-<картын key>~<асуултын дугаар>» → файл дахь асуулт (зөв хариу, тайлбартай)
export function findFileQuestion(id: string) {
  if (!id.startsWith(DEMO_PREFIX)) return null;
  const [cardKey, index] = id.slice(DEMO_PREFIX.length).split("~");
  const card = readPrecomputed().cards.find((c) => c.key === cardKey);
  return card?.quiz[Number(index)] ?? null;
}

async function getFeedFromDb(persona: Persona): Promise<FeedCard[]> {
  const cards = await prisma.card.findMany({
    where: {
      publishedAt: { lte: new Date() },
      ...(persona === "ALL" ? {} : { personas: { hasSome: [persona, "ALL"] } }),
    },
    orderBy: [{ order: "asc" }, { publishedAt: "desc" }],
    select: {
      id: true,
      kind: true,
      emoji: true,
      hook: true,
      before: true,
      after: true,
      youMeaning: true,
      sourceQuote: true,
      personas: true,
      sourceUrl: true,
      order: true,
      projectId: true,
      clauseId: true,
      project: { select: { title: true, categoryTitle: true, publishedAt: true, description: true } },
      clause: { select: { number: true, diff: true, what: true } },
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, question: true, options: true },
      },
    },
  });

  return cards.map(({ questions, project, clause, ...c }) => ({
    ...c,
    projectTitle: project?.title ?? null,
    categoryTitle: project?.categoryTitle ?? null,
    projectPublishedAt: project?.publishedAt ? project.publishedAt.toISOString() : null,
    projectKind: project ? billKindOf(project.title, project.description) : null,
    clauseNumber: clause?.number ?? null,
    what: clause?.what ?? null,
    diff: clause ? (clause.diff as unknown as WordPart[]) : null,
    quiz: questions.map((q) => ({ id: q.id, question: q.question, options: toOptions(q.options) })),
  }));
}

// ───────────── Санал хураалт ─────────────

// hidden* талбаруудыг хэзээ ч сонгохгүй — жинхэнэ тоо reveal хүртэл нууц.
export const voteEventSelect = {
  id: true,
  title: true,
  hook: true,
  status: true,
  isReplay: true,
  closesAt: true,
  projectId: true,
  actualSupport: true,
  actualOppose: true,
  actualTotal: true,
  passed: true,
  revealedAt: true,
  _count: { select: { predictions: true } },
} as const;

type VoteEventRow = {
  id: string;
  title: string;
  hook: string;
  status: VoteEvent["status"];
  isReplay: boolean;
  closesAt: Date | null;
  projectId: string | null;
  actualSupport: number | null;
  actualOppose: number | null;
  actualTotal: number | null;
  passed: boolean | null;
  revealedAt: Date | null;
  _count: { predictions: number };
};

export function toVoteEvent(e: VoteEventRow, predictionYes?: number): VoteEvent {
  // Бодит тоо зөвхөн REVEALED үед
  const revealed = e.status === "REVEALED";
  return {
    id: e.id,
    title: e.title,
    hook: e.hook,
    isReplay: e.isReplay,
    status: e.status,
    closesAt: e.closesAt ? e.closesAt.toISOString() : null,
    actualSupport: revealed ? e.actualSupport : null,
    actualOppose: revealed ? e.actualOppose : null,
    actualTotal: revealed ? e.actualTotal : null,
    passed: revealed ? e.passed : null,
    projectId: e.projectId,
    predictionCount: e._count.predictions,
    ...(predictionYes !== undefined ? { predictionYes } : {}),
    revealedAt: revealed && e.revealedAt ? e.revealedAt.toISOString() : null,
  };
}

// Нээлттэй (OPEN) нь эхэнд, дараа нь дүн гарсан (REVEALED) — шинэ нь эхэнд
// Олны таамгийн харьцаа: санал хураалт бүрт "батлагдана" гэсэн таамгийн тоо (бодит, DB-ээс)
// DB хоосон бол mirror-оос өмнөх санал хураалтуудыг нэг удаа нэмнэ. DB огт хүрэхгүй бол дүн гарсан байдлаар (зөвхөн харах).
export async function getVoteEvents(): Promise<VoteEvent[]> {
  try {
    await ensureVoteEvents().catch((error) => console.error("Таамаг бөглөж чадсангүй:", error instanceof Error ? error.message : error));
    return await getVoteEventsFromDb();
  } catch (error) {
    console.error("Санал хураалтыг DB-ээс уншиж чадсангүй, data/snapshots-оос уншина:", error instanceof Error ? error.message : error);
    const agendas = await listAgendas({ q: "", limit: 500, offset: 0 });
    return agendas.items
      .filter((a) => a.finalVote)
      .slice(0, 8)
      .map((a) => {
        const v = a.finalVote!;
        return {
          id: `${DEMO_PREFIX}${a.agendaCode}`,
          title: a.title,
          hook: "Энэ асуудлыг УИХ батлах уу?",
          isReplay: true,
          status: "REVEALED" as const,
          closesAt: null,
          actualSupport: v.support,
          actualOppose: v.oppose,
          actualTotal: v.total,
          passed: v.supportMajority,
          projectId: null,
          predictionCount: 0,
          predictionYes: 0,
          revealedAt: v.votedAt,
        };
      });
  }
}

async function getVoteEventsFromDb(): Promise<VoteEvent[]> {
  const [events, yes] = await Promise.all([
    prisma.voteEvent.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      select: voteEventSelect,
    }),
    prisma.prediction.groupBy({ by: ["voteEventId"], where: { willPass: true }, _count: { _all: true } }),
  ]);
  const yesByEvent = new Map(yes.map((y) => [y.voteEventId, y._count._all]));
  return events.map((e) => toVoteEvent(e, yesByEvent.get(e.id) ?? 0));
}

// ───────────── Тэмдэг (хуваалцах хуудас) ─────────────

// Бүтэн нэрээс зөвхөн эхний үг (Clerk-ийн firstName). Имэйл хэзээ ч гаргахгүй.
export function firstNameOf(name: string | null): string {
  const first = name?.trim().split(/\s+/)[0];
  return first || "Иргэн";
}

export async function getPublicBadge(id: string): Promise<PublicBadge | null> {
  const badge = await prisma.badge.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      createdAt: true,
      user: { select: { name: true } },
      submission: { select: { clause: { select: { number: true, project: { select: { title: true } } } } } },
    },
  });
  if (!badge) return null;

  return {
    id: badge.id,
    type: badge.type,
    firstName: firstNameOf(badge.user.name),
    lawTitle: badge.submission?.clause.project.title ?? null,
    clauseNumber: badge.submission?.clause.number ?? null,
    date: badge.createdAt.toISOString(),
  };
}
