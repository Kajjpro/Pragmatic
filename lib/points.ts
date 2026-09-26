// Оноо, streak, тэмдгийг ЗӨВХӨН энэ файлд тооцно.
// Дүрэм: оноо өгөх бүр нэг transaction дотор, давхардахгүй "түлхүүр"-тэй мөр бичиж байж өгнө.
//   карт   → CardView (хэрэглэгч + карт + өдөр)
//   асуулт → QuizAnswer (хэрэглэгч + асуулт)
//   таамаг → Prediction (хэрэглэгч + санал хураалт)
//   санал  → Comment.relevantPoints, Badge.key "LAW_CHANGER:<submissionId>"
// Тиймээс нэг хүсэлт хоёр удаа ирсэн ч оноо хоёр дахин нэмэгдэхгүй.
import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { Badge, BadgeType, Prediction } from "@/lib/types";

// Онооны дүрмийг хөтөч ч уншдаг тул тусад нь (DB-гүй) файлд байлгана
export { POINTS, STREAK_BADGE_DAYS } from "@/lib/points-rules";
import { POINTS, STREAK_BADGE_DAYS, SUPPORT_GUESS_POINTS } from "@/lib/points-rules";

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
  const tier = SUPPORT_GUESS_POINTS.find((t) => miss <= t.within);
  if (tier) points += tier.points;

  return points;
}

// ───────────── Тэмдэг ─────────────

// DB-ийн тэмдэг → API-ийн Badge. LAW_CHANGER бол хууль, заалтын нэрийг саналаас авна.
export function toBadge(
  b: { id: string; type: BadgeType; createdAt: Date },
  law: { lawTitle: string; clauseNumber: string } | null = null,
): Badge {
  return {
    id: b.id,
    type: b.type,
    createdAt: b.createdAt.toISOString(),
    lawTitle: law?.lawTitle ?? null,
    clauseNumber: law?.clauseNumber ?? null,
  };
}

// Тэмдгийг нээнэ. key давхцвал (аль хэдийн авсан) юу ч үүсгэхгүй, null буцаана.
async function unlockBadge(
  tx: Tx,
  data: { key: string; userId: string; type: BadgeType; submissionId?: string },
): Promise<{ id: string; type: BadgeType; createdAt: Date } | null> {
  const created = await tx.badge.createManyAndReturn({ data: [data], skipDuplicates: true });
  return created.length === 1 ? created[0] : null;
}

// ───────────── Оноо өгөх функцууд ─────────────

// Карт үзсэн: үзэлт, streak-ийг бичнэ, 7 хоног дараалбал STREAK_7.
// Зөвхөн гүйлгэхэд оноо ӨГӨХГҮЙ (оноо хуурахаас сэргийлнэ). Уншсаны +1-ийг тэр картын асуултад
// анх зөв хариулахад awardQuizAnswer өгнө — жинхэнэ уншсан эсэхийг асуултаар шалгана.
export async function awardCardView(userId: string, cardId: string) {
  const today = mongolianDay();

  return prisma.$transaction(async (tx) => {
    // 1. Өнөөдрийн үзэлтийг бичнэ (давхардвал алгасна). Оноо өгөхгүй — дээрх тайлбарыг үз.
    await tx.cardView.createMany({
      data: [{ userId, cardId, day: dayToDate(today) }],
      skipDuplicates: true,
    });
    const pointsAwarded = 0;

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
    const newBadges: Badge[] = [];
    if (streak >= STREAK_BADGE_DAYS) {
      const badge = await unlockBadge(tx, { key: `STREAK_7:${userId}`, userId, type: "STREAK_7" });
      if (badge) newBadges.push(toBadge(badge));
    }

    return { points: user.points, streak: user.streak, pointsAwarded, newBadges };
  });
}

// Асуултад хариулсан: зөвхөн анхны оролдлого хадгалагдана, зөв бол +3.
// Тэр картын асуултад АНХ удаа зөв хариулж байгаа бол картыг уншсаны +1 нэмж өгнө.
// Асуулт олдохгүй бол null. chosenIndex-ийн хүрээг route шалгасан байх ёстой.
export async function awardQuizAnswer(userId: string, questionId: string, chosenIndex: number) {
  return prisma.$transaction(async (tx) => {
    const question = await tx.quizQuestion.findUnique({
      where: { id: questionId },
      select: { correctIndex: true, explanation: true, cardId: true },
    });
    if (!question) return null;

    const correct = chosenIndex === question.correctIndex;

    // Эхний хариулт л бичигдэнэ. Дахин хариулбал count = 0.
    const inserted = await tx.quizAnswer.createMany({
      data: [{ userId, questionId, chosenIndex, correct }],
      skipDuplicates: true,
    });
    const firstTry = inserted.count === 1;
    let pointsAwarded = firstTry && correct ? POINTS.QUIZ_CORRECT : 0;

    // Картыг уншсаны оноо: энэ картын асуултуудаас зөв хариулсан нь яг энэ нэг бол (анхны зөв хариулт)
    if (pointsAwarded > 0) {
      const correctOnCard = await tx.quizAnswer.count({
        where: { userId, correct: true, question: { cardId: question.cardId } },
      });
      if (correctOnCard === 1) pointsAwarded += POINTS.CARD_VIEW;
    }

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
  | { status: "OK"; prediction: Prediction; newBadges: Badge[] }
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
    const newBadges: Badge[] = [];
    const badge = await unlockBadge(tx, { key: `FIRST_PREDICTION:${userId}`, userId, type: "FIRST_PREDICTION" });
    if (badge) newBadges.push(toBadge(badge));

    return {
      status: "OK" as const,
      prediction: {
        id: p.id,
        voteEventId: p.voteEventId,
        willPass: p.willPass,
        supportGuess: p.supportGuess,
        points: p.points,
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
// submissionId = иргэний саналын (Comment) id.
export async function awardReflected(userId: string, submissionId: string) {
  return prisma.$transaction(async (tx) => {
    const submission = await tx.comment.findUnique({
      where: { id: submissionId },
      select: {
        userId: true,
        clause: { select: { number: true, project: { select: { title: true } } } },
      },
    });
    if (!submission || submission.userId !== userId) return { pointsAwarded: 0, badge: null };

    const created = await unlockBadge(tx, {
      key: `LAW_CHANGER:${submissionId}`,
      userId,
      type: "LAW_CHANGER",
      submissionId,
    });
    if (!created) return { pointsAwarded: 0, badge: null }; // аль хэдийн өгсөн

    await tx.user.update({
      where: { id: userId },
      data: { points: { increment: POINTS.REFLECTED } },
    });
    await tx.notification.create({
      data: { userId, text: "✅ Таны санал хуульд тусгагдлаа", link: `/b/${created.id}` },
    });

    const badge = toBadge(created, {
      lawTitle: submission.clause.project.title,
      clauseNumber: submission.clause.number,
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

// ───────────── Санал хураалтын дүн (reveal) ─────────────

export type VoteCounts = { support: number; oppose: number; total: number };

// "Дэмжсэн нь олонх" = дэмжсэн > эсэргүүцсэн. Хууль батлагдах эрх зүйн дүрэм гэж БҮҮ тайлбарла.
export function supportMajority(counts: VoteCounts): boolean {
  return counts.support > counts.oppose;
}

// Санал хураалтын дүнг зарлаж, бүх таамгийг НЭГ transaction-д оноожуулна.
// OPEN → REVEALED шилжилт нэг л удаа болдог тул хоёр дахь дуудлага юу ч хийхгүй (null буцаана).
export async function revealVoteEvent(eventId: string, counts: VoteCounts) {
  const passed = supportMajority(counts);

  return prisma.$transaction(
    async (tx) => {
      // 1. Зөвхөн OPEN байвал REVEALED болгоно (давхар reveal-ээс хамгаална)
      const marked = await tx.voteEvent.updateMany({
        where: { id: eventId, status: "OPEN" },
        data: {
          status: "REVEALED",
          actualSupport: counts.support,
          actualOppose: counts.oppose,
          actualTotal: counts.total,
          passed,
          revealedAt: new Date(),
        },
      });
      if (marked.count === 0) return null;

      // 2. Таамаг бүрийг оноожуулна
      const predictions = await tx.prediction.findMany({
        where: { voteEventId: eventId },
        select: { id: true, userId: true, willPass: true, supportGuess: true },
      });

      let pointsAwarded = 0;
      const notifications: { userId: string; text: string; link: string }[] = [];
      for (const p of predictions) {
        const points = scorePrediction(p, { passed, actualSupport: counts.support });
        await tx.prediction.update({ where: { id: p.id }, data: { points } });
        if (points > 0) {
          await tx.user.update({ where: { id: p.userId }, data: { points: { increment: points } } });
        }
        pointsAwarded += points;
        notifications.push({ userId: p.userId, text: `Таамгийн дүн гарлаа: +${points} оноо`, link: "/predict" });
      }

      // 3. Таамагласан хүн бүрт мэдэгдэл
      await tx.notification.createMany({ data: notifications });

      return { passed, scored: predictions.length, pointsAwarded };
    },
    { timeout: 30_000 }, // олон таамагтай үед 5 секундээс удаж болно
  );
}
