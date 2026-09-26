// Тэргүүлэгчид — хэсэг бүрт тусдаа оноо. Шинэ багана хэрэггүй: оноог хадгалсан мөрүүдээс тооцно.
//   Өнөөдрийн хууль: зөв хариулт × 3 + уншсан карт (асуултад нь зөв хариулсан) × 1 — lib/points.ts-ийн дүрэмтэй ижил
//   Таамаг:          Prediction.points-ийн нийлбэр (reveal хийхэд бичигддэг)
// Нэр: «Нэр О.» (овгийн эхний үсэг) — имэйл хэзээ ч гаргахгүй.
import { levelFor, POINTS } from "@/lib/points-rules";
import { prisma } from "@/lib/prisma";

export type LeaderboardSection = "feed" | "predict";

export type LeaderboardRow = {
  rank: number;
  userId: string;
  name: string;
  score: number;
  level: number; // Lv — энэ хэсгийн оноогоор
  badges: number; // авсан тэмдгийн тоо
  detail: string; // «12 зөв хариулт · 5 карт» г.м.
};

// «Тугс-Очир Энхбаатар» → «Тугс-Очир Э.»
export function displayName(name: string | null): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return "Иргэн";
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[1][0]}.`;
}

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
  const rows = await prisma.$queryRaw<{ userId: string; name: string | null; correct: number; cards: number; badges: number }[]>`
    select qa."userId", u.name,
      (select count(*) from "Badge" b where b."userId" = qa."userId")::int as badges,
      (count(*) filter (where qa.correct))::int as correct,
      (count(distinct q."cardId") filter (where qa.correct))::int as cards
    from "QuizAnswer" qa
    join "QuizQuestion" q on q.id = qa."questionId"
    join "User" u on u.id = qa."userId"
    group by qa."userId", u.name`;

  return withRanks(
    rows.map((r) => {
      const score = r.correct * POINTS.QUIZ_CORRECT + r.cards * POINTS.CARD_VIEW;
      return {
        userId: r.userId,
        name: displayName(r.name),
        score,
        level: levelFor(score),
        badges: r.badges,
        detail: `${r.correct} зөв хариулт · ${r.cards} карт уншсан`,
      };
    }),
  ).slice(0, LIMIT);
}

async function predictBoard(): Promise<LeaderboardRow[]> {
  const rows = await prisma.$queryRaw<{ userId: string; name: string | null; points: number; total: number; revealed: number; correct: number; badges: number }[]>`
    select p."userId", u.name,
      (select count(*) from "Badge" b where b."userId" = p."userId")::int as badges,
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
      name: displayName(r.name),
      score: r.points,
      level: levelFor(r.points),
      badges: r.badges,
      detail: `${r.total} таамаг · дүн гарснаас ${r.correct}/${r.revealed} зөв`,
    })),
  ).slice(0, LIMIT);
}

export function getLeaderboard(section: LeaderboardSection): Promise<LeaderboardRow[]> {
  return section === "feed" ? feedBoard() : predictBoard();
}
