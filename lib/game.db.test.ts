// Санал хураалтын тоглоом (sync, reveal) ба seed-ийг жинхэнэ DB дээр шалгана: npm run test:db
import "dotenv/config";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { Client } from "pg";
import type { AgendaVote } from "./parliament";
import type { SeedData } from "./seed";

const SCHEMA = process.env.DATABASE_SCHEMA ?? "";
const enabled = /^[a-z0-9_]*(scratch|test)[a-z0-9_]*$/.test(SCHEMA);
const skip = !enabled && "set DATABASE_SCHEMA=<something with scratch or test in the name> to run";

let prisma: typeof import("./prisma").prisma;
let points: typeof import("./points");
let voteEvents: typeof import("./vote-events");
let parliament: typeof import("./parliament");
let seed: typeof import("./seed");

// Эцсийн санал хураалт = эцсийн шатны "...төслийг эцэслэн батлах" санал (lib/parliament.ts finalReadingVote)
let voteSeq = 0;
const vote = (code: string, support: number, oppose: number, isFinalReading: boolean): AgendaVote => ({
  customId: `1_${++voteSeq}`,
  agendaCode: code,
  agendaTitle: `Төсөл ${code}`,
  meetingId: 1,
  name: isFinalReading ? `Төсөл ${code} төслийг эцэслэн батлах санал хураалт явуулъя` : `Төсөл ${code} төслийг хэлэлцэхийг дэмжье`,
  voteType: isFinalReading ? "Эцэслэн батлах" : "Хэлэлцэх эсэх",
  support,
  oppose,
  total: support + oppose,
  present: support + oppose,
  votedAt: null,
});

// Хуурамч ParliamentAPI: A1 — эцсийн санал хураалт болсон, A2 — болоогүй, A3 — API-д алга
let apiDown = false;
const fakeClient = {
  async getAgendaList() {
    if (apiDown) throw new parliament.ParliamentApiError("УИХ-ын ParliamentAPI-тай холбогдож чадсангүй");
    return [
      { agendaCode: "A1", title: "Нэг" },
      { agendaCode: "A2", title: "Хоёр" },
      { agendaCode: "A4", title: "Дөрөв" },
    ];
  },
  async getAgendaVoteList(code: string) {
    if (apiDown) throw new parliament.ParliamentApiError("УИХ-ын ParliamentAPI-тай холбогдож чадсангүй");
    if (code === "A1") return [vote(code, 40, 30, false), vote(code, 70, 10, true)];
    return [vote(code, 30, 20, false)];
  },
};

const hooks = [
  { agendaCode: "A1", title: "Хуулийн төсөл А1", hook: "А1 дэмжигдэх үү?" },
  { agendaCode: "A2", title: "Хуулийн төсөл А2", hook: "А2 дэмжигдэх үү?" },
  { agendaCode: "A3", title: "API-д алга", hook: "?" },
];

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
  voteEvents = await import("./vote-events");
  parliament = await import("./parliament");
  seed = await import("./seed");

  // A4: төсөлд agendaCode байгаа ч hook алга
  await prisma.project.create({ data: { title: "Төсөл А4", agendaCode: "A4", source: "UPLOAD" } });
});

after(async () => {
  if (!enabled) return;
  await prisma.$disconnect();
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  await c.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
  await c.end();
});

test("sync: replay-г таньж, тоог нууцалж хадгална; hook алга, API-д алгыг алгасна", { skip }, async () => {
  const r = await voteEvents.syncVoteEvents(fakeClient, hooks);
  assert.deepEqual([r.checked, r.created, r.updated, r.replays], [4, 2, 0, 1]);
  assert.deepEqual(r.skipped.map((s) => s.agendaCode).sort(), ["A3", "A4"]);

  const a1 = await prisma.voteEvent.findUniqueOrThrow({ where: { agendaCode: "A1" } });
  assert.equal(a1.isReplay, true);
  assert.equal(a1.status, "OPEN");
  assert.deepEqual([a1.hiddenSupport, a1.hiddenOppose, a1.hiddenTotal], [70, 10, 80]);
  assert.deepEqual([a1.actualSupport, a1.passed], [null, null]); // reveal хүртэл нийтэд гарахгүй
  assert.equal(a1.hook, "А1 дэмжигдэх үү?");

  const a2 = await prisma.voteEvent.findUniqueOrThrow({ where: { agendaCode: "A2" } });
  assert.equal(a2.isReplay, false);
  assert.equal(a2.hiddenSupport, null);

  // Дахин ажиллуулахад шинээр үүсгэхгүй
  const again = await voteEvents.syncVoteEvents(fakeClient, hooks);
  assert.deepEqual([again.created, again.updated], [0, 2]);
  assert.equal(await prisma.voteEvent.count(), 2);
});

test("sync: ParliamentAPI унасан бол ParliamentApiError, DB хөндөгдөхгүй", { skip }, async () => {
  apiDown = true;
  await assert.rejects(voteEvents.syncVoteEvents(fakeClient, hooks), parliament.ParliamentApiError);
  apiDown = false;
  assert.equal(await prisma.voteEvent.count(), 2);
});

test("reveal: replay-ийн нууц тоогоор бүх таамгийг нэг удаа оноожуулна", { skip }, async () => {
  const a1 = await prisma.voteEvent.findUniqueOrThrow({ where: { agendaCode: "A1" } });
  const user = (clerkId: string) => prisma.user.create({ data: { clerkId } });
  const [u1, u2, u3] = [await user("p1"), await user("p2"), await user("p3")];
  await points.savePrediction(u1.id, a1.id, true, 70); // бүгд зөв → 20
  await points.savePrediction(u2.id, a1.id, true, 60); // зөв, 10-аар зөрсөн → 10 + 2
  await points.savePrediction(u3.id, a1.id, false, 10); // буруу, хол → 0

  const found = await voteEvents.findRevealCounts(a1.id, fakeClient);
  assert.deepEqual(found, { status: "OK", counts: { support: 70, oppose: 10, total: 80 } });
  if (found.status !== "OK") return;

  const r = await points.revealVoteEvent(a1.id, found.counts);
  assert.deepEqual(r, { passed: true, scored: 3, pointsAwarded: 32 });

  const pointsOf = async (id: string) => (await prisma.user.findUniqueOrThrow({ where: { id } })).points;
  assert.deepEqual([await pointsOf(u1.id), await pointsOf(u2.id), await pointsOf(u3.id)], [20, 12, 0]);
  const preds = await prisma.prediction.findMany({ where: { voteEventId: a1.id }, orderBy: { points: "desc" } });
  assert.deepEqual(preds.map((p) => p.points), [20, 12, 0]);

  const notes = await prisma.notification.findMany({ where: { userId: u2.id } });
  assert.deepEqual(notes.map((n) => [n.text, n.link]), [["Таамгийн дүн гарлаа: +12 оноо", "/predict"]]);

  const revealed = await prisma.voteEvent.findUniqueOrThrow({ where: { id: a1.id } });
  assert.deepEqual([revealed.status, revealed.actualSupport, revealed.actualOppose, revealed.passed], ["REVEALED", 70, 10, true]);

  // Хоёр дахь reveal юу ч хийхгүй — оноо давхардахгүй
  assert.equal(await points.revealVoteEvent(a1.id, found.counts), null);
  assert.equal(await pointsOf(u1.id), 20);
  assert.equal(await prisma.notification.count({ where: { userId: u1.id } }), 1);
  assert.deepEqual(await voteEvents.findRevealCounts(a1.id, fakeClient), { status: "ALREADY_REVEALED" });

  // Дүн гарсныг sync дахин өөрчлөхгүй
  const s = await voteEvents.syncVoteEvents(fakeClient, hooks);
  assert.ok(s.skipped.some((x) => x.agendaCode === "A1" && /аль хэдийн/.test(x.reason)));
});

test("sync discover: hook-гүй ч ParliamentAPI-ийн сүүлийн, санал хураалттай асуудлыг энгийн асуулттай нэмнэ", { skip }, async () => {
  const client = {
    async getAgendaList() {
      return [
        { agendaCode: "A1", title: "Нэг" },
        { agendaCode: "20250200075", title: "Шинэ хууль" },
        { agendaCode: "20250200076", title: "Санал хураагаагүй" },
      ];
    },
    async getAgendaVoteList(code: string) {
      if (code === "20250200075") return [vote(code, 50, 10, true)];
      if (code === "A1") return [vote(code, 70, 10, true)];
      return [];
    },
  };
  // discover-гүй бол hook-гүй асуудал нэмэгдэхгүй
  await voteEvents.syncVoteEvents(client, []);
  assert.equal(await prisma.voteEvent.count({ where: { agendaCode: "20250200075" } }), 0);

  const r = await voteEvents.syncVoteEvents(client, [], { discover: true });
  assert.ok(r.skipped.some((x) => x.agendaCode === "20250200076" && /болоогүй/.test(x.reason)));
  const found = await prisma.voteEvent.findUniqueOrThrow({ where: { agendaCode: "20250200075" } });
  assert.deepEqual([found.title, found.hook, found.isReplay, found.hiddenSupport], ["Шинэ хууль", "УИХ энэ асуудлыг дэмжих үү?", true, 50]);
  assert.equal(await prisma.voteEvent.count({ where: { agendaCode: "20250200076" } }), 0);
  await prisma.voteEvent.delete({ where: { agendaCode: "20250200075" } });
});

test("reveal: replay биш бол ParliamentAPI-аас; эцсийн санал хураалт болоогүй бол хүлээнэ", { skip }, async () => {
  const a2 = await prisma.voteEvent.findUniqueOrThrow({ where: { agendaCode: "A2" } });
  assert.deepEqual(await voteEvents.findRevealCounts(a2.id, fakeClient), { status: "NOT_VOTED_YET" });

  apiDown = true;
  await assert.rejects(voteEvents.findRevealCounts(a2.id, fakeClient), parliament.ParliamentApiError);
  apiDown = false;

  assert.deepEqual(await voteEvents.findRevealCounts("no-such-event", fakeClient), { status: "NOT_FOUND" });
});

// Dev 2-ийн precomputed.json-ийн жижиг хувилбар
const data: SeedData = {
  bills: [
    {
      key: "demo",
      title: "Демо хууль",
      summary: "Товч",
      sourceUrl: "https://lawforum.parliament.mn/p/1",
      comparison: [
        {
          number: "3.1",
          oldText: "хариуцлагатай байна.",
          newText: "хариуцлагатай байж болно.",
          changeType: "CHANGED",
          sourceQuote: "«байна» гэснийг «байж болно» гэж",
          what: "юу",
          why: "яагаад",
          who: "хэнд",
        },
      ],
    },
    { key: "lf-9", lawforumId: 9, title: "Өөр төсөл", summary: "Товч", sourceUrl: "https://lawforum.parliament.mn/p/9" },
  ],
  cards: [
    {
      key: "demo-3.1",
      kind: "CHANGE",
      projectKey: "demo",
      clauseNumber: "3.1",
      emoji: "⚠️",
      hook: "Хариуцлага суларч магадгүй",
      before: "хариуцлагатай байна.",
      after: "хариуцлагатай байж болно.",
      youMeaning: "Чамд хамаатай.",
      personas: ["WORKER", "ROBOT"],
      sourceUrl: "https://lawforum.parliament.mn/p/1",
      order: 1,
      quiz: [
        { question: "Юу өөрчлөгдөх вэ?", options: ["А", "Б", "В"], correctIndex: 1, explanation: "Б" },
        { question: "Буруу асуулт", options: ["А"], correctIndex: 3, explanation: "" },
      ],
    },
    {
      key: "lf-9",
      kind: "BILL",
      projectKey: "lf-9",
      emoji: "📜",
      hook: "Өөр төсөл",
      youMeaning: "Чамд.",
      personas: [],
      sourceUrl: "https://lawforum.parliament.mn/p/9",
      order: 2,
      quiz: [],
    },
  ],
  voteEvents: [{ agendaCode: "S1", title: "Seed санал хураалт", hook: "Дэмжигдэх үү?", isReplay: true }],
  comments: [
    { key: "c1", clauseNumber: "3.1", name: "Бат", vote: "SUPPORT", text: "Дэмжиж байна", filterStatus: "RELEVANT", filterReason: "" },
    { key: "c2", clauseNumber: "3.1", name: "Дорж", vote: "x", text: "Зам засаач", filterStatus: "OFF_TOPIC", filterReason: "сэдвээс гадуур" },
    { key: "c3", clauseNumber: "9.9", name: "", vote: "OPPOSE", text: "Алга заалт", filterStatus: "RELEVANT", filterReason: "" },
  ],
  groups: [
    { key: "g1", clauseNumber: "3.1", title: "Дэмжсэн", summary: "1 санал", commentKeys: ["c1"], replyDraft: "Баярлалаа", demoReflectable: true },
  ],
};

test("seed: бүх зүйлийг AI-гүй хадгалж, дахин ажиллуулахад давхардахгүй", { skip }, async () => {
  const opts = {
    dataDir: "/no-such-dir",
    demoCitizenEmail: "Demo@Example.com",
    demoCitizenComment: "Миний санал",
    staffEmails: ["staff@example.com"],
  };
  const r = await seed.seedDatabase(data, opts);
  assert.deepEqual(
    [r.bills, r.clauses, r.cards, r.questions, r.voteEvents, r.comments, r.filtered, r.groups],
    [2, 1, 2, 1, 1, 2, 1, 1],
  );
  assert.ok(r.warnings.some((w) => w.includes("2-р асуулт")));
  assert.ok(r.warnings.some((w) => w.includes("c3")));
  assert.ok(r.warnings.some((w) => w.includes("replay")));

  const clause = await prisma.clause.findUniqueOrThrow({ where: { id: "seed-demo-3.1" } });
  assert.equal(clause.approved, true);
  assert.ok(JSON.stringify(clause.diff).includes("байж болно"));

  const card = await prisma.card.findUniqueOrThrow({ where: { id: "demo-3.1" }, include: { questions: true } });
  assert.deepEqual(card.personas, ["WORKER"]);
  assert.equal(card.clauseId, "seed-demo-3.1");
  assert.deepEqual(card.questions.map((q) => q.id), ["demo-3.1-q1"]);
  assert.deepEqual((await prisma.card.findUniqueOrThrow({ where: { id: "lf-9" } })).personas, ["ALL"]);

  const bill = await prisma.project.findUniqueOrThrow({ where: { lawforumId: 9 } });
  assert.equal(bill.source, "LAWFORUM");

  const c2 = await prisma.comment.findUniqueOrThrow({ where: { id: "seed-c2" } });
  assert.deepEqual([c2.filterStatus, c2.clusterId, c2.vote], ["OFF_TOPIC", null, "NEUTRAL"]);
  assert.equal((await prisma.comment.findUniqueOrThrow({ where: { id: "seed-c1" } })).clusterId, "seed-g1");

  // Демо иргэний санал "Тусгасан" болох бүлэгт, +2 нэг удаа
  const citizen = await prisma.user.findFirstOrThrow({ where: { email: "demo@example.com" } });
  assert.equal(citizen.clerkId, "seed:demo@example.com");
  const mine = await prisma.comment.findUniqueOrThrow({ where: { id: "seed-demo-citizen" } });
  assert.deepEqual([mine.userId, mine.clusterId, mine.filterStatus], [citizen.id, "seed-g1", "RELEVANT"]);
  assert.equal(citizen.points, 2);
  const staff = await prisma.user.findFirstOrThrow({ where: { email: "staff@example.com" } });
  assert.equal(staff.role, "STAFF");

  // Ажилтны хариуг seed дарж бичихгүй
  await prisma.cluster.update({ where: { id: "seed-g1" }, data: { replyText: "Тусгалаа", reflection: "REFLECTED", repliedAt: new Date() } });

  const again = await seed.seedDatabase(data, opts);
  assert.equal(again.cards, 2);
  assert.equal(await prisma.card.count(), 2);
  assert.equal(await prisma.comment.count(), 3);
  assert.equal(await prisma.user.count({ where: { email: { in: ["demo@example.com", "staff@example.com"] } } }), 2);
  assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: citizen.id } })).points, 2);
  assert.equal((await prisma.cluster.findUniqueOrThrow({ where: { id: "seed-g1" } })).reflection, "REFLECTED");

  // Файлаас хасагдсан карт устна
  await seed.seedDatabase({ ...data, cards: data.cards.slice(0, 1) }, opts);
  assert.deepEqual((await prisma.card.findMany({ select: { id: true } })).map((c) => c.id), ["demo-3.1"]);

  // Демо иргэн "Тусгасан" болоход тэмдэг авна
  assert.equal(await points.awardReflectedForGroup("seed-g1"), 1);
  const badge = await prisma.badge.findFirstOrThrow({ where: { userId: citizen.id, type: "LAW_CHANGER" } });
  assert.equal(badge.submissionId, "seed-demo-citizen");
});

test("seed: буруу файл ойлгомжтой алдаа өгнө", async () => {
  const { parseSeedData } = await import("./seed"); // DB хэрэггүй
  assert.throws(() => parseSeedData("not json"), /зөв JSON биш/);
  assert.throws(() => parseSeedData('{"bills": []}'), /"cards" массив/);
});
