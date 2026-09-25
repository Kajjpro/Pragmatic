// Демогийн өмнө (эсвэл бэлтгэлийн дараа) демо төлөвийг seed хийсэн үеийнх рүү буцаана. AI дуудахгүй.
//   1. Replay санал хураалтууд → дахин OPEN (өгсөн оноог буцааж хасна)
//   2. Демо төслийн бүлгүүд (seed-*) → хариугүй, "Хүлээгдэж буй"
//   3. Демо иргэн → оноо, streak, тэмдэг, таамаг, мэдэгдэл, үзсэн карт, хариулсан асуулт цэвэрлэнэ;
//      бэлтгэлийн үеэр бичсэн нэмэлт саналыг устгана (seed-ийн демо санал үлдэнэ, +2 дахин өгнө)
import { awardRelevantComment } from "@/lib/points";
import { prisma } from "@/lib/prisma";
import { DEMO_COMMENT_ID } from "@/lib/seed";

export type ResetReport = {
  demoCitizen: string | null;
  voteEventsReopened: number;
  predictionPointsReverted: number; // бусад хэрэглэгчээс буцааж хассан таамгийн оноо
  groupsReopened: number;
  cleared: {
    badges: number;
    notifications: number;
    predictions: number;
    cardViews: number;
    quizAnswers: number;
    extraComments: number;
  };
  warnings: string[];
};

export async function resetDemo(opts: { demoCitizenEmail?: string } = {}): Promise<ResetReport> {
  const report: ResetReport = {
    demoCitizen: null,
    voteEventsReopened: 0,
    predictionPointsReverted: 0,
    groupsReopened: 0,
    cleared: { badges: 0, notifications: 0, predictions: 0, cardViews: 0, quizAnswers: 0, extraComments: 0 },
    warnings: [],
  };

  const citizen = opts.demoCitizenEmail
    ? await prisma.user.findFirst({
        where: { email: { equals: opts.demoCitizenEmail.trim(), mode: "insensitive" } },
        select: { id: true, email: true },
      })
    : null;
  if (!opts.demoCitizenEmail) report.warnings.push("DEMO_CITIZEN_EMAIL хоосон — демо иргэнийг цэвэрлээгүй");
  else if (!citizen) report.warnings.push(`${opts.demoCitizenEmail} хэрэглэгч алга — эхлээд npm run seed`);

  await prisma.$transaction(
    async (tx) => {
      // 1. Дүн гарсан replay санал хураалтуудыг дахин нээнэ
      const revealed = await tx.voteEvent.findMany({
        where: { status: "REVEALED", isReplay: true },
        select: {
          id: true,
          hiddenSupport: true,
          hiddenOppose: true,
          hiddenTotal: true,
          actualSupport: true,
          actualOppose: true,
          actualTotal: true,
          predictions: { select: { id: true, userId: true, points: true } },
        },
      });
      for (const ev of revealed) {
        for (const p of ev.predictions) {
          if (p.points > 0) {
            await tx.user.update({ where: { id: p.userId }, data: { points: { decrement: p.points } } });
            report.predictionPointsReverted += p.points;
          }
        }
        await tx.prediction.updateMany({ where: { voteEventId: ev.id }, data: { points: 0 } });
        await tx.voteEvent.update({
          where: { id: ev.id },
          data: {
            status: "OPEN",
            // API-аас авсан бодит тоог нууцалж үлдээнэ — дараагийн reveal API-гүй ажиллана
            hiddenSupport: ev.hiddenSupport ?? ev.actualSupport,
            hiddenOppose: ev.hiddenOppose ?? ev.actualOppose,
            hiddenTotal: ev.hiddenTotal ?? ev.actualTotal,
            actualSupport: null,
            actualOppose: null,
            actualTotal: null,
            passed: null,
            revealedAt: null,
          },
        });
        report.voteEventsReopened++;
      }

      // 2. Демо төслийн бүлгүүдийг хариугүй болгоно (AI-ийн хариуны ноорог үлдэнэ)
      const groups = await tx.cluster.updateMany({
        where: { id: { startsWith: "seed-" }, OR: [{ replyText: { not: null } }, { reflection: { not: "PENDING" } }] },
        data: { replyText: null, reflection: "PENDING", repliedAt: null, status: "OPEN" },
      });
      report.groupsReopened = groups.count;

      // 3. Демо иргэний явцыг цэвэрлэнэ
      if (!citizen) return;
      const userId = citizen.id;
      report.demoCitizen = citizen.email;
      report.cleared.badges = (await tx.badge.deleteMany({ where: { userId } })).count;
      report.cleared.notifications = (await tx.notification.deleteMany({ where: { userId } })).count;
      report.cleared.predictions = (await tx.prediction.deleteMany({ where: { userId } })).count;
      report.cleared.cardViews = (await tx.cardView.deleteMany({ where: { userId } })).count;
      report.cleared.quizAnswers = (await tx.quizAnswer.deleteMany({ where: { userId } })).count;
      // Бэлтгэлийн үеэр демо бүртгэлээр бичсэн санал (багийн туршилт) — бодит иргэний санал биш
      report.cleared.extraComments = (
        await tx.comment.deleteMany({ where: { userId, id: { not: DEMO_COMMENT_ID } } })
      ).count;

      await tx.user.update({
        where: { id: userId },
        data: { points: 0, streak: 0, lastActiveDate: null, persona: "ALL" },
      });
      await tx.comment.updateMany({ where: { id: DEMO_COMMENT_ID }, data: { relevantPoints: false } });
    },
    { timeout: 60_000 },
  );

  // 4. Демо санал хамааралтай тул seed-тэй адил +2 (нэг л удаа)
  if (citizen) {
    const demoComment = await prisma.comment.findUnique({
      where: { id: DEMO_COMMENT_ID },
      select: { userId: true, clusterId: true },
    });
    if (!demoComment || demoComment.userId !== citizen.id) {
      report.warnings.push("Демо иргэний санал алга — DEMO_CITIZEN_COMMENT-тэй npm run seed ажиллуулна уу");
    } else {
      await awardRelevantComment(citizen.id, DEMO_COMMENT_ID);
      if (!demoComment.clusterId) report.warnings.push("Демо санал бүлэггүй — npm run seed дахин ажиллуулна уу");
    }
  }

  return report;
}
