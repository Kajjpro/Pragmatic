// Оноо, тэмдэг, /api/me, feed-ийг жинхэнэ DB дээр шалгана (тусдаа schema үүсгээд устгана):
//   npm run test:db
import "dotenv/config";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { Client } from "pg";
import type { AiApi } from "./law/ai";

const SCHEMA = process.env.DATABASE_SCHEMA ?? "";
const enabled = /^[a-z0-9_]*(scratch|test)[a-z0-9_]*$/.test(SCHEMA);
const skip = !enabled && "set DATABASE_SCHEMA=<something with scratch or test in the name> to run";

let prisma: typeof import("./prisma").prisma;
let points: typeof import("./points");
let feed: typeof import("./feed");
let me: typeof import("./me");
let grouping: typeof import("./law/grouping");

// Бүх санал хамааралтай, нэг бүлэгт орно
const fakeAi: AiApi = {
  async readAmendment() {
    return [];
  },
  async explainChange() {
    return { what: "", why: "", who: "" };
  },
  async filterComments(_t, comments) {
    return comments.map((c) => ({ id: c.id, status: "RELEVANT" as const, reason: "" }));
  },
  async groupComments(_t, comments) {
    return [{ title: "Бүлэг", summary: "хураангуй", commentIds: comments.map((c) => c.id) }];
  },
  async writeReply() {
    return "ноорог";
  },
};

const s = {
  citizen: "",
  other: "",
  staff: "",
  cardStudent: "",
  cardDriver: "",
  cardAll: "",
  q1: "",
  q2: "",
  openEvent: "",
  openEvent2: "",
  draftEvent: "",
  revealedEvent: "",
  billId: "",
  clauseId: "",
};

const pointsOf = async (id: string) =>
  (await prisma.user.findUniqueOrThrow({ where: { id }, select: { points: true } })).points;

before(async () => {
  if (!enabled) return;
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  await c.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
  await c.query(`CREATE SCHEMA ${SCHEMA}`);
  await c.query(`SET search_path TO ${SCHEMA}`);
  for (const d of readdirSync("prisma/migrations").filter((x) => /^\d/.test(x)).sort()) {
    await c.query(readFileSync(`prisma/migrations/${d}/migration.sql`, "utf8"));
  }
  await c.end();

  prisma = (await import("./prisma")).prisma;
  points = await import("./points");
  feed = await import("./feed");
  me = await import("./me");
  grouping = await import("./law/grouping");

  const user = (clerkId: string, name: string, role: "CITIZEN" | "STAFF" = "CITIZEN") =>
    prisma.user.create({ data: { clerkId, name, email: `${clerkId}@example.com`, role } });
  s.citizen = (await user("c1", "Болд Бат")).id;
  s.other = (await user("c2", "Сараа Дорж")).id;
  s.staff = (await user("s1", "Ажилтан", "STAFF")).id;

  const bill = await prisma.project.create({
    data: {
      title: "Замын хөдөлгөөний тухай хууль",
      source: "UPLOAD",
      clauses: { create: { number: "3.1", order: 0, oldText: "хуучин", newText: "шинэ", changeType: "CHANGED", approved: true } },
    },
    include: { clauses: true },
  });
  s.billId = bill.id;
  s.clauseId = bill.clauses[0].id;

  const card = (slug: string, order: number, personas: ("STUDENT" | "DRIVER" | "ALL")[]) =>
    prisma.card.create({
      data: {
        slug,
        title: slug,
        hook: "дэгээ",
        body: "тайлбар",
        personas,
        order,
        projectId: bill.id,
        questions: {
          create: [
            { order: 0, question: "Асуулт 1?", options: ["А", "Б", "В"], correctIndex: 1, explanation: "Учир нь Б" },
            { order: 1, question: "Асуулт 2?", options: ["Тийм", "Үгүй"], correctIndex: 0, explanation: "Тийм" },
          ],
        },
      },
      include: { questions: { orderBy: { order: "asc" } } },
    });
  const student = await card("student", 2, ["STUDENT"]);
  s.cardStudent = student.id;
  s.q1 = student.questions[0].id;
  s.q2 = student.questions[1].id;
  s.cardDriver = (await card("driver", 1, ["DRIVER"])).id;
  s.cardAll = (await card("all", 3, ["ALL"])).id;

  const event = (agendaCode: string, status: "DRAFT" | "OPEN" | "REVEALED", extra = {}) =>
    prisma.voteEvent.create({ data: { agendaCode, title: agendaCode, hook: "Батлагдах уу?", status, ...extra } });
  s.openEvent = (await event("A1", "OPEN", { isReplay: true, hiddenSupport: 70, hiddenOppose: 10, hiddenTotal: 80 })).id;
  s.openEvent2 = (await event("A2", "OPEN")).id;
  s.draftEvent = (await event("A3", "DRAFT")).id;
  s.revealedEvent = (
    await event("A4", "REVEALED", {
      actualSupport: 60,
      actualOppose: 20,
      actualTotal: 80,
      passed: true,
      revealedAt: new Date(),
    })
  ).id;
});

after(async () => {
  if (!enabled) return;
  await prisma.$disconnect();
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  await c.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
  await c.end();
});

test("card view: +1 once per card per day, even when requests arrive at the same time", { skip }, async () => {
  const results = await Promise.all(
    Array.from({ length: 5 }, () => points.awardCardView(s.citizen, s.cardStudent)),
  );
  assert.equal(results.filter((r) => r.pointsAwarded === 1).length, 1);
  assert.equal(await pointsOf(s.citizen), 1);

  const second = await points.awardCardView(s.citizen, s.cardDriver);
  assert.equal(second.pointsAwarded, 1);
  assert.equal(second.points, 2);
  assert.equal(second.streak, 1);
  assert.deepEqual(second.newBadges, []);
});

test("streak: 6 days in a row + today = 7 and STREAK_7 unlocks exactly once", { skip }, async () => {
  const yesterday = new Date(Date.parse(points.mongolianDay()) - 86_400_000);
  await prisma.user.update({ where: { id: s.other }, data: { streak: 6, lastActiveDate: yesterday } });

  const r = await points.awardCardView(s.other, s.cardAll);
  assert.equal(r.streak, 7);
  assert.deepEqual(r.newBadges.map((b) => b.type), ["STREAK_7"]);

  const again = await points.awardCardView(s.other, s.cardDriver);
  assert.equal(again.streak, 7);
  assert.deepEqual(again.newBadges, []);
  assert.equal(await prisma.badge.count({ where: { userId: s.other, type: "STREAK_7" } }), 1);
});

test("streak: a missed day starts again from 1", { skip }, async () => {
  const threeDaysAgo = new Date(Date.parse(points.mongolianDay()) - 3 * 86_400_000);
  await prisma.user.update({ where: { id: s.other }, data: { streak: 5, lastActiveDate: threeDaysAgo } });
  await prisma.cardView.deleteMany({ where: { userId: s.other } });

  const r = await points.awardCardView(s.other, s.cardAll);
  assert.equal(r.streak, 1);
});

test("quiz: +3 only when the first answer is correct", { skip }, async () => {
  const before = await pointsOf(s.citizen);

  const wrong = await points.awardQuizAnswer(s.citizen, s.q1, 0);
  assert.equal(wrong!.correct, false);
  assert.equal(wrong!.correctIndex, 1);
  assert.equal(wrong!.explanation, "Учир нь Б");
  assert.equal(wrong!.pointsAwarded, 0);

  const retry = await points.awardQuizAnswer(s.citizen, s.q1, 1);
  assert.equal(retry!.correct, true);
  assert.equal(retry!.pointsAwarded, 0);
  assert.equal(retry!.firstTry, false);

  const right = await points.awardQuizAnswer(s.citizen, s.q2, 0);
  assert.equal(right!.pointsAwarded, 3);
  assert.equal(right!.points, before + 3);

  const twice = await points.awardQuizAnswer(s.citizen, s.q2, 0);
  assert.equal(twice!.pointsAwarded, 0);
  assert.equal(await pointsOf(s.citizen), before + 3);

  assert.equal(await points.awardQuizAnswer(s.citizen, "no-such-question", 0), null);
});

test("prediction: only while OPEN, one per user, FIRST_PREDICTION once", { skip }, async () => {
  const first = await points.savePrediction(s.citizen, s.openEvent, true, 65);
  assert.equal(first.status, "OK");
  if (first.status !== "OK") return;
  assert.equal(first.prediction.supportGuess, 65);
  assert.equal(first.prediction.pointsAwarded, null);
  assert.deepEqual(first.newBadges.map((b) => b.type), ["FIRST_PREDICTION"]);

  assert.equal((await points.savePrediction(s.citizen, s.openEvent, false, 10)).status, "ALREADY");

  const second = await points.savePrediction(s.citizen, s.openEvent2, false, 40);
  assert.equal(second.status, "OK");
  if (second.status === "OK") assert.deepEqual(second.newBadges, []);

  assert.equal((await points.savePrediction(s.citizen, s.draftEvent, true, 1)).status, "CLOSED");
  assert.equal((await points.savePrediction(s.citizen, s.revealedEvent, true, 1)).status, "CLOSED");
  assert.equal((await points.savePrediction(s.citizen, "no-such-event", true, 1)).status, "NOT_FOUND");
});

test("comments: grouping gives +2 per relevant citizen comment, never twice", { skip }, async () => {
  const before = await pointsOf(s.citizen);
  const mine = await prisma.comment.create({ data: { clauseId: s.clauseId, userId: s.citizen, body: "Миний санал" } });
  await prisma.comment.create({ data: { clauseId: s.clauseId, userId: s.staff, body: "Ажилтны санал" } });
  await prisma.comment.create({ data: { clauseId: s.clauseId, body: "Нэргүй санал" } });

  await grouping.groupBillComments(s.billId, fakeAi);
  assert.equal(await pointsOf(s.citizen), before + 2);

  assert.equal(await points.awardRelevantComment(s.citizen, mine.id), 0);
  await grouping.groupBillComments(s.billId, fakeAi);
  assert.equal(await pointsOf(s.citizen), before + 2);
});

test("reflected: +50, LAW_CHANGER badge and notification once, only for citizens", { skip }, async () => {
  const group = await prisma.cluster.findFirstOrThrow({ where: { clauseId: s.clauseId } });
  const citizenBefore = await pointsOf(s.citizen);
  const staffBefore = await pointsOf(s.staff);

  assert.equal(await points.awardReflectedForGroup(group.id), 1);
  assert.equal(await pointsOf(s.citizen), citizenBefore + 50);
  assert.equal(await pointsOf(s.staff), staffBefore);

  const badge = await prisma.badge.findFirstOrThrow({ where: { userId: s.citizen, type: "LAW_CHANGER" } });
  assert.equal(badge.lawTitle, "Замын хөдөлгөөний тухай хууль");
  assert.equal(badge.clauseNumber, "3.1");

  const notes = await prisma.notification.findMany({ where: { userId: s.citizen } });
  assert.equal(notes.length, 1);
  assert.equal(notes[0].text, "✅ Таны санал хуульд тусгагдлаа");
  assert.equal(notes[0].link, `/b/${badge.id}`);

  assert.equal(await points.awardReflectedForGroup(group.id), 0);
  assert.equal(await pointsOf(s.citizen), citizenBefore + 50);
  assert.equal(await prisma.notification.count({ where: { userId: s.citizen } }), 1);
});

test("feed: persona filter, order, and no answers leaked", { skip }, async () => {
  const slugs = async (p: "STUDENT" | "DRIVER" | "ALL") => (await feed.getFeed(p)).map((c) => c.slug);
  assert.deepEqual(await slugs("ALL"), ["driver", "student", "all"]);
  assert.deepEqual(await slugs("STUDENT"), ["student", "all"]);
  assert.deepEqual(await slugs("DRIVER"), ["driver", "all"]);

  const [card] = await feed.getFeed("STUDENT");
  assert.equal(card.billId, s.billId);
  assert.deepEqual(Object.keys(card.questions[0]).sort(), ["id", "options", "question"]);
  assert.ok(!JSON.stringify(card).includes("correctIndex"));
  assert.ok(!JSON.stringify(card).includes("Учир нь Б"));
});

test("vote events: only OPEN and REVEALED, real numbers only after reveal", { skip }, async () => {
  const events = await feed.getVoteEvents();
  assert.deepEqual(events.map((e) => e.agendaCode).sort(), ["A1", "A2", "A4"]);
  assert.deepEqual(events.map((e) => e.status), ["OPEN", "OPEN", "REVEALED"]);

  const replay = events.find((e) => e.agendaCode === "A1")!;
  assert.equal(replay.isReplay, true);
  assert.equal(replay.result, null);
  assert.equal(replay.predictionCount, 1);
  assert.ok(!JSON.stringify(events).includes("hidden"));

  const revealed = events.find((e) => e.agendaCode === "A4")!;
  assert.deepEqual(revealed.result, { support: 60, oppose: 20, total: 80, passed: true });
});

test("public badge: first name only, never email", { skip }, async () => {
  const badge = await prisma.badge.findFirstOrThrow({ where: { userId: s.citizen, type: "LAW_CHANGER" } });
  const pub = await feed.getPublicBadge(badge.id);
  assert.equal(pub!.firstName, "Болд");
  assert.equal(pub!.lawTitle, "Замын хөдөлгөөний тухай хууль");
  assert.deepEqual(Object.keys(pub!).sort(), ["clauseNumber", "date", "firstName", "id", "lawTitle", "type"]);
  assert.ok(!JSON.stringify(pub).includes("@"));
  assert.ok(!JSON.stringify(pub).includes("Бат"));
  assert.equal(await feed.getPublicBadge("no-such-badge"), null);
});

test("me: everything in one view", { skip }, async () => {
  const view = await me.getMe(s.citizen);
  assert.equal(view.name, "Болд Бат");
  assert.equal(view.points, await pointsOf(s.citizen));
  assert.equal(view.streak, 1);
  assert.equal(view.activeToday, true);
  assert.deepEqual(view.badges.map((b) => b.type).sort(), ["FIRST_PREDICTION", "LAW_CHANGER"]);
  assert.equal(view.predictions.length, 2);
  assert.equal(view.predictions[0].event.title.startsWith("A"), true);
  assert.equal(view.comments.length, 1);
  assert.equal(view.comments[0].filterStatus, "RELEVANT");
  assert.equal(view.comments[0].clause.billTitle, "Замын хөдөлгөөний тухай хууль");
  assert.equal(view.notifications.length, 1);
  assert.deepEqual(view.viewedCardIdsToday.sort(), [s.cardDriver, s.cardStudent].sort());
  assert.equal(view.quizAnswers.length, 2);
});
