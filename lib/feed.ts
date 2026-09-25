// Нэвтрээгүй хүн ч харах өгөгдөл: картууд, санал хураалтууд, тэмдгийн хуваалцах мэдээлэл.
// AI хэзээ ч дуудахгүй — зөвхөн DB-ээс уншина.
import { prisma } from "@/lib/prisma";
import { PERSONAS, type FeedCard, type Persona, type PublicBadge, type VoteEvent } from "@/lib/types";

export function isPersona(v: unknown): v is Persona {
  return typeof v === "string" && (PERSONAS as readonly string[]).includes(v);
}

// QuizQuestion.options нь Json багана — зөвхөн текстүүдийг үлдээнэ
export function toOptions(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((o): o is string => typeof o === "string") : [];
}

// ───────────── Картууд ─────────────

// ALL = бүх карт. Бусад үед тэр хүмүүст эсвэл бүгдэд (ALL) зориулсан картууд.
// Асуултын зөв хариу, тайлбарыг энд ЯВУУЛАХГҮЙ.
export async function getFeed(persona: Persona): Promise<FeedCard[]> {
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
      personas: true,
      sourceUrl: true,
      order: true,
      projectId: true,
      clauseId: true,
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, question: true, options: true },
      },
    },
  });

  return cards.map(({ questions, ...c }) => ({
    ...c,
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

export function toVoteEvent(e: VoteEventRow): VoteEvent {
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
    revealedAt: revealed && e.revealedAt ? e.revealedAt.toISOString() : null,
  };
}

// Нээлттэй (OPEN) нь эхэнд, дараа нь дүн гарсан (REVEALED) — шинэ нь эхэнд
export async function getVoteEvents(): Promise<VoteEvent[]> {
  const events = await prisma.voteEvent.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: voteEventSelect,
  });
  return events.map(toVoteEvent);
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
