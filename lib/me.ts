// GET /api/me — нэвтэрсэн иргэний бүх мэдээлэл нэг дор.
// Бүх асуулгыг зэрэг (Promise.all) ажиллуулна — давталт дотор DB дуудахгүй (N+1 байхгүй).
import { getMyComments } from "@/lib/law/queries";
import { dateToDay, dayToDate, mongolianDay, toBadge, visibleStreak } from "@/lib/points";
import { prisma } from "@/lib/prisma";
import { toVoteEvent, voteEventSelect } from "@/lib/feed";
import type { MeData } from "@/lib/types";

export async function getMe(userId: string): Promise<MeData> {
  const today = mongolianDay();

  const [user, predictions, comments, notifications, quizAnswers, viewsToday] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        persona: true,
        points: true,
        streak: true,
        lastActiveDate: true,
        badges: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            type: true,
            createdAt: true,
            submissionId: true,
            submission: { select: { clause: { select: { number: true, project: { select: { title: true } } } } } },
          },
        },
      },
    }),
    prisma.prediction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        voteEventId: true,
        willPass: true,
        supportGuess: true,
        points: true,
        createdAt: true,
        voteEvent: { select: voteEventSelect },
      },
    }),
    getMyComments(userId),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, text: true, link: true, readAt: true, createdAt: true },
    }),
    prisma.quizAnswer.findMany({
      where: { userId },
      select: { questionId: true, chosenIndex: true, correct: true },
    }),
    prisma.cardView.findMany({
      where: { userId, day: dayToDate(today) },
      select: { cardId: true },
    }),
  ]);

  const lastDay = user.lastActiveDate ? dateToDay(user.lastActiveDate) : null;

  return {
    id: user.id,
    name: user.name,
    role: user.role,
    persona: user.persona,
    points: user.points,
    streak: visibleStreak(lastDay, today, user.streak),
    activeToday: lastDay === today,
    badges: user.badges.map((b) => ({
      ...toBadge(
        b,
        b.submission && { lawTitle: b.submission.clause.project.title, clauseNumber: b.submission.clause.number },
      ),
      commentId: b.submissionId,
    })),
    predictions: predictions.map(({ voteEvent, createdAt, ...p }) => ({
      ...p,
      createdAt: createdAt.toISOString(),
      event: toVoteEvent(voteEvent),
    })),
    comments,
    notifications: notifications.map((n) => ({
      id: n.id,
      text: n.text,
      link: n.link,
      read: n.readAt !== null,
      createdAt: n.createdAt.toISOString(),
    })),
    quizAnswers,
    viewedCardIdsToday: viewsToday.map((v) => v.cardId),
  };
}
