// Нэвтрээгүй хүн ч харах өгөгдөл: картууд, санал хураалтууд, тэмдгийн хуваалцах мэдээлэл.
// AI хэзээ ч дуудахгүй — зөвхөн DB-ээс уншина.
import { prisma } from "@/lib/prisma";
import { PERSONAS, type FeedCard, type Persona, type PublicBadge, type VoteEventView } from "@/lib/types";

export function isPersona(v: unknown): v is Persona {
  return typeof v === "string" && (PERSONAS as readonly string[]).includes(v);
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
      slug: true,
      title: true,
      hook: true,
      body: true,
      personas: true,
      order: true,
      publishedAt: true,
      sourceUrl: true,
      projectId: true,
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, question: true, options: true },
      },
    },
  });

  return cards.map(({ projectId, publishedAt, ...c }) => ({
    ...c,
    publishedAt: publishedAt.toISOString(),
    billId: projectId,
  }));
}

// ───────────── Санал хураалт ─────────────

// hidden* талбаруудыг хэзээ ч сонгохгүй — жинхэнэ тоо reveal хүртэл нууц.
export const voteEventSelect = {
  id: true,
  agendaCode: true,
  title: true,
  hook: true,
  status: true,
  isReplay: true,
  voteDate: true,
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
  agendaCode: string;
  title: string;
  hook: string;
  status: VoteEventView["status"];
  isReplay: boolean;
  voteDate: Date | null;
  projectId: string | null;
  actualSupport: number | null;
  actualOppose: number | null;
  actualTotal: number | null;
  passed: boolean | null;
  revealedAt: Date | null;
  _count: { predictions: number };
};

export function toVoteEventView(e: VoteEventRow): VoteEventView {
  // Бодит тоо зөвхөн REVEALED үед
  const revealed =
    e.status === "REVEALED" &&
    e.actualSupport !== null &&
    e.actualOppose !== null &&
    e.actualTotal !== null &&
    e.passed !== null;

  return {
    id: e.id,
    agendaCode: e.agendaCode,
    title: e.title,
    hook: e.hook,
    status: e.status,
    isReplay: e.isReplay,
    voteDate: e.voteDate ? e.voteDate.toISOString() : null,
    billId: e.projectId,
    predictionCount: e._count.predictions,
    result: revealed
      ? { support: e.actualSupport!, oppose: e.actualOppose!, total: e.actualTotal!, passed: e.passed! }
      : null,
    revealedAt: revealed && e.revealedAt ? e.revealedAt.toISOString() : null,
  };
}

// Нээлттэй (OPEN) нь эхэнд, дараа нь дүн гарсан (REVEALED) — шинэ нь эхэнд
export async function getVoteEvents(): Promise<VoteEventView[]> {
  const events = await prisma.voteEvent.findMany({
    where: { status: { in: ["OPEN", "REVEALED"] } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: voteEventSelect,
  });
  return events.map(toVoteEventView);
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
      lawTitle: true,
      clauseNumber: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });
  if (!badge) return null;

  return {
    id: badge.id,
    type: badge.type,
    firstName: firstNameOf(badge.user.name),
    lawTitle: badge.lawTitle,
    clauseNumber: badge.clauseNumber,
    date: badge.createdAt.toISOString(),
  };
}
