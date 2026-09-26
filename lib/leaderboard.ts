// Тэргүүлэгчид — хэсэг бүрт тусдаа оноо. Шинэ багана хэрэггүй: оноог хадгалсан мөрүүдээс тооцно.
//   Өнөөдрийн хууль: зөв хариулт × 3 + уншсан карт (асуултад нь зөв хариулсан) × 1 — lib/points.ts-ийн дүрэмтэй ижил
//   Таамаг:          Prediction.points-ийн нийлбэр (reveal хийхэд бичигддэг)
// Зөвхөн нэрийн эхний үгийг харуулна, имэйл хэзээ ч гаргахгүй.
import { firstNameOf } from "@/lib/feed";
import { POINTS } from "@/lib/points-rules";
import { prisma } from "@/lib/prisma";

export type LeaderboardSection = "feed" | "predict";

export type LeaderboardRow = {
  rank: number;
  userId: string;
  name: string;
  score: number;
  detail: string; // «12 зөв хариулт · 5 карт» г.м.
};

const LIMIT = 100;

// Оноо тэнцвэл ижил байр (1, 2, 2, 4 …)
function withRanks<T extends { score: number }>(rows: T[]): (T & { rank: number })[] {
  const sorted = [...rows].sort((a, b) => b.score - a.score);
  return sorted.map((row, i) => ({
    ...row,
    rank: i > 0 && sorted[i - 1].score === row.score ? sorted.findIndex((r) => r.score === row.score) + 1 : i + 1,
  }));
}

async function feedBoard(): Promise<LeaderboardRow[]> {
  const rows = await prisma.$queryRaw<{ userId: string; name: string | null; correct: number; cards: number }[]>`
    select qa."userId", u.name,
      (count(*) filter (where qa.correct))::int as correct,
      (count(distinct q."cardId") filter (where qa.correct))::int as cards
    from "QuizAnswer" qa
    join "QuizQuestion" q on q.id = qa."questionId"
    join "User" u on u.id = qa."userId"
    group by qa."userId", u.name`;

  return withRanks(
    rows.map((r) => ({
      userId: r.userId,
      name: firstNameOf(r.name),
      score: r.correct * POINTS.QUIZ_CORRECT + r.cards * POINTS.CARD_VIEW,
      detail: `${r.correct} зөв хариулт · ${r.cards} карт уншсан`,
    })),
  ).slice(0, LIMIT);
}

async function predictBoard(): Promise<LeaderboardRow[]> {
  const rows = await prisma.$queryRaw<{ userId: string; name: string | null; points: number; total: number; revealed: number; correct: number }[]>`
    select p."userId", u.name,
      coalesce(sum(p.points), 0)::int as points,
      count(*)::int as total,
      (count(*) filter (where e.status = 'REVEALED'))::int as revealed,
      (count(*) filter (where e.status = 'REVEALED' and p."willPass" = e.passed))::int as correct
    from "Prediction" p
    join "VoteEvent" e on e.id = p."voteEventId"
    join "User" u on u.id = p."userId"
    group by p."userId", u.name`;

  return withRanks(
    rows.map((r) => ({
      userId: r.userId,
      name: firstNameOf(r.name),
      score: r.points,
      detail: `${r.total} таамаг · дүн гарснаас ${r.correct}/${r.revealed} зөв`,
    })),
  ).slice(0, LIMIT);
}

export function getLeaderboard(section: LeaderboardSection): Promise<LeaderboardRow[]> {
  return section === "feed" ? feedBoard() : predictBoard();
}
