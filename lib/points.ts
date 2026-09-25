// Оноо, streak, тэмдгийг ЗӨВХӨН энэ файлд тооцно.
// Дүрэм: оноо өгөх бүр нэг transaction дотор, давхардахгүй "түлхүүр"-тэй мөр бичиж байж өгнө.
//   карт   → CardView (хэрэглэгч + карт + өдөр)
//   асуулт → QuizAnswer (хэрэглэгч + асуулт)
//   таамаг → Prediction (хэрэглэгч + санал хураалт)
//   санал  → Comment.relevantPoints, Badge.key "LAW_CHANGER:<commentId>"
// Тиймээс нэг хүсэлт хоёр удаа ирсэн ч оноо хоёр дахин нэмэгдэхгүй.
import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { BadgeType, BadgeView, PredictionView } from "@/lib/types";

export const POINTS = {
  CARD_VIEW: 1, // карт үзэх — өдөрт нэг картад нэг удаа
  QUIZ_CORRECT: 3, // асуултад анхны оролдлогоор зөв хариулах
  PREDICTION_PASS: 10, // батлагдах эсэхийг зөв таах
  RELEVANT_COMMENT: 2, // AI санал "хамааралтай" гэж үзсэн
  REFLECTED: 50, // санал хуульд тусгагдсан
} as const;

export const STREAK_BADGE_DAYS = 7;

type Tx = Prisma.TransactionClient;

// ───────────── Өдөр (Улаанбаатарын цагаар) ─────────────

const TIME_ZONE = "Asia/Ulaanbaatar";

// "2026-09-25" хэлбэрээр өнөөдрийг буцаана (en-CA нь YYYY-MM-DD хэлбэртэй)
export function mongolianDay(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

// "2026-09-25" → DB-ийн DATE багананд хадгалах Date
export function dayToDate(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

// DB-ийн DATE → "2026-09-25"
export function dateToDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Хоёр өдрийн зөрүү (b - a), өдрөөр
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

// ───────────── Цэвэр дүрмүүд (DB-гүй — тестлэхэд хялбар) ─────────────

// Шинэ streak: өчигдөр идэвхтэй байсан бол +1, өнөөдөр аль хэдийн бол хэвээр, өдөр алгассан бол 1-ээс эхэлнэ.
export function nextStreak(lastActiveDay: string | null, today: string, currentStreak: number): number {
  if (lastActiveDay === null) return 1;
  const gap = daysBetween(lastActiveDay, today);
  if (gap <= 0) return Math.max(currentStreak, 1); // өнөөдөр аль хэдийн тоологдсон
  if (gap === 1) return currentStreak + 1; // дараалсан өдөр
  return 1; // өдөр алгассан → дахин эхэлнэ
}

// Дэлгэцэнд харуулах streak: өнөөдөр эсвэл өчигдөр идэвхтэй байгаагүй бол 0 (тасарсан).
export function visibleStreak(lastActiveDay: string | null, today: string, streak: number): number {
  if (lastActiveDay === null) return 0;
  return daysBetween(lastActiveDay, today) <= 1 ? streak : 0;
}

// Таамгийн оноо:
//   батлагдах эсэхийг зөв таасан → +10
//   дэмжсэн гишүүдийн тоо ±3 дотор → +10, ±8 → +5, ±15 → +2
// Дүн гараагүй (passed эсвэл actualSupport байхгүй) бол 0.
export function scorePrediction(
  prediction: { willPass: boolean; supportGuess: number },
  event: { passed: boolean | null; actualSupport: number | null },
): number {
  if (event.passed === null || event.actualSupport === null) return 0;

  let points = 0;
  if (prediction.willPass === event.passed) points += POINTS.PREDICTION_PASS;

  const miss = Math.abs(prediction.supportGuess - event.actualSupport);
  if (miss <= 3) points += 10;
  else if (miss <= 8) points += 5;
  else if (miss <= 15) points += 2;

  return points;
}

// ───────────── Тэмдэг ─────────────

type BadgeRow = {
  id: string;
  type: BadgeType;
  lawTitle: string | null;
  clauseNumber: string | null;
  createdAt: Date;
};

export function toBadgeView(b: BadgeRow): BadgeView {
  return {
    id: b.id,
    type: b.type,
    lawTitle: b.lawTitle,
    clauseNumber: b.clauseNumber,
    createdAt: b.createdAt.toISOString(),
  };
}

// Тэмдгийг нээнэ. key давхцвал (аль хэдийн авсан) юу ч үүсгэхгүй, null буцаана.
async function unlockBadge(
  tx: Tx,
  data: {
    key: string;
    userId: string;
    type: BadgeType;
    commentId?: string;
    lawTitle?: string;
    clauseNumber?: string;
  },
): Promise<BadgeView | null> {
  const created = await tx.badge.createManyAndReturn({ data: [data], skipDuplicates: true });
  return created.length === 1 ? toBadgeView(created[0]) : null;
}

// ───────────── Оноо өгөх функцууд ─────────────

// Карт үзсэн: өдөрт нэг картад +1, streak шинэчилнэ, 7 хоног дараалбал STREAK_7.
export async function awardCardView(userId: string, cardId: string) {
  const today = mongolianDay();

  return prisma.$transaction(async (tx) => {
    // 1. Өнөөдрийн үзэлтийг бичнэ. Аль хэдийн байвал count = 0 (оноо өгөхгүй).
    const inserted = await tx.cardView.createMany({
      data: [{ userId, cardId, day: dayToDate(today), pointsAwarded: POINTS.CARD_VIEW }],
      skipDuplicates: true,
    });
    const pointsAwarded = inserted.count === 1 ? POINTS.CARD_VIEW : 0;

    // 2. Streak-ийг тооцно
    const before = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { streak: true, lastActiveDate: true },
    });
    const lastDay = before.lastActiveDate ? dateToDay(before.lastActiveDate) : null;
    const streak = nextStreak(lastDay, today, before.streak);

    // 3. Оноо, streak-ийг хадгална
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        points: { increment: pointsAwarded },
        streak,
        lastActiveDate: dayToDate(today),
      },
      select: { points: true, streak: true },
    });

    // 4. 7 хоног дараалсан бол тэмдэг
    const newBadges: BadgeView[] = [];
    if (streak >= STREAK_BADGE_DAYS) {
      const badge = await unlockBadge(tx, { key: `STREAK_7:${userId}`, userId, type: "STREAK_7" });
      if (badge) newBadges.push(badge);
    }

    return { points: user.points, streak: user.streak, pointsAwarded, newBadges };
  });
}

// Асуултад хариулсан: зөвхөн анхны оролдлого хадгалагдана, зөв бол +3.
// Асуулт олдохгүй бол null. chosenIndex-ийн хүрээг route шалгасан байх ёстой.
export async function awardQuizAnswer(userId: string, questionId: string, chosenIndex: number) {
  return prisma.$transaction(async (tx) => {
    const question = await tx.quizQuestion.findUnique({
      where: { id: questionId },
      select: { correctIndex: true, explanation: true },
    });
    if (!question) return null;

    const correct = chosenIndex === question.correctIndex;

    // Эхний хариулт л бичигдэнэ. Дахин хариулбал count = 0.
    const inserted = await tx.quizAnswer.createMany({
      data: [{ userId, questionId, chosenIndex, correct, pointsAwarded: correct ? POINTS.QUIZ_CORRECT : 0 }],
      skipDuplicates: true,
    });
    const firstTry = inserted.count === 1;
    const pointsAwarded = firstTry && correct ? POINTS.QUIZ_CORRECT : 0;

    const user = await tx.user.update({
      where: { id: userId },
      data: { points: { increment: pointsAwarded } },
      select: { points: true },
    });

    return {
      correct,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      pointsAwarded,
      points: user.points,
      firstTry,
    };
  });
}

// Таамаг хадгална (нэг хэрэглэгч нэг санал хураалтад нэг л удаа).
// Анхны таамаг бол FIRST_PREDICTION тэмдэг нээнэ. Оноог reveal хийхэд scorePrediction-оор өгнө.
export type SavePredictionResult =
  | { status: "OK"; prediction: PredictionView; newBadges: BadgeView[] }
  | { status: "NOT_FOUND" | "CLOSED" | "ALREADY" };

export async function savePrediction(
  userId: string,
  voteEventId: string,
  willPass: boolean,
  supportGuess: number,
): Promise<SavePredictionResult> {
  return prisma.$transaction(async (tx) => {
    const event = await tx.voteEvent.findUnique({ where: { id: voteEventId }, select: { status: true } });
    if (!event) return { status: "NOT_FOUND" as const };
    if (event.status !== "OPEN") return { status: "CLOSED" as const };

    const created = await tx.prediction.createManyAndReturn({
      data: [{ userId, voteEventId, willPass, supportGuess }],
      skipDuplicates: true,
    });
    if (created.length === 0) return { status: "ALREADY" as const };

    const p = created[0];
    const newBadges: BadgeView[] = [];
    const badge = await unlockBadge(tx, { key: `FIRST_PREDICTION:${userId}`, userId, type: "FIRST_PREDICTION" });
    if (badge) newBadges.push(badge);

    return {
      status: "OK" as const,
      prediction: {
        id: p.id,
        voteEventId: p.voteEventId,
        willPass: p.willPass,
        supportGuess: p.supportGuess,
        pointsAwarded: p.pointsAwarded,
        createdAt: p.createdAt.toISOString(),
      },
      newBadges,
    };
  });
}

// AI санал "хамааралтай" гэж үзсэн: +2 (нэг саналд нэг л удаа).
// Буцаах утга: өгсөн оноо (0 эсвэл 2).
export async function awardRelevantComment(userId: string, commentId: string): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const marked = await tx.comment.updateMany({
      where: { id: commentId, userId, filterStatus: "RELEVANT", relevantPoints: false },
      data: { relevantPoints: true },
    });
    if (marked.count === 0) return 0;

    await tx.user.update({
      where: { id: userId },
      data: { points: { increment: POINTS.RELEVANT_COMMENT } },
    });
    return POINTS.RELEVANT_COMMENT;
  });
}

// Санал хуульд тусгагдсан: +50, LAW_CHANGER тэмдэг, мэдэгдэл. Нэг саналд нэг л удаа.
export async function awardReflected(userId: string, commentId: string) {
  return prisma.$transaction(async (tx) => {
    const comment = await tx.comment.findUnique({
      where: { id: commentId },
      select: {
        userId: true,
        clause: { select: { number: true, project: { select: { title: true } } } },
      },
    });
    if (!comment || comment.userId !== userId) return { pointsAwarded: 0, badge: null };

    const badge = await unlockBadge(tx, {
      key: `LAW_CHANGER:${commentId}`,
      userId,
      type: "LAW_CHANGER",
      commentId,
      lawTitle: comment.clause.project.title,
      clauseNumber: comment.clause.number,
    });
    if (!badge) return { pointsAwarded: 0, badge: null }; // аль хэдийн өгсөн

    await tx.user.update({
      where: { id: userId },
      data: { points: { increment: POINTS.REFLECTED } },
    });
    await tx.notification.create({
      data: { userId, text: "✅ Таны санал хуульд тусгагдлаа", link: `/b/${badge.id}` },
    });
    return { pointsAwarded: POINTS.REFLECTED, badge };
  });
}

// Ажилтан бүлгийг "Тусгасан" гэж тэмдэглэхэд: тэр бүлгийн иргэн бүрийн саналд awardReflected.
// Буцаах утга: шинээр тэмдэг авсан саналын тоо.
export async function awardReflectedForGroup(groupId: string): Promise<number> {
  const comments = await prisma.comment.findMany({
    where: { clusterId: groupId, user: { role: "CITIZEN" } },
    select: { id: true, userId: true },
  });

  let awarded = 0;
  for (const c of comments) {
    if (!c.userId) continue;
    const r = await awardReflected(c.userId, c.id);
    if (r.badge) awarded++;
  }
  return awarded;
}
