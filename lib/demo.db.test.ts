// Питчийн демогийн бүх алхмыг дарааллаар нь, дараа нь reset-demo хийгээд ДАХИН шалгана: npm run test:db
// Ажилтан "Санал бүлэглэх" дарахад AI дуудагдвал тест унана (демо AI хүлээх ёсгүй).
import "dotenv/config";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { Client } from "pg";
import type { AiApi } from "./law/ai";
import type { SeedData } from "./seed";

const SCHEMA = process.env.DATABASE_SCHEMA ?? "";
const enabled = /^[a-z0-9_]*(scratch|test)[a-z0-9_]*$/.test(SCHEMA);
const skip = !enabled && "set DATABASE_SCHEMA=<something with scratch or test in the name> to run";

let prisma: typeof import("./prisma").prisma;
let points: typeof import("./points");
let feed: typeof import("./feed");
let me: typeof import("./me");
let queries: typeof import("./law/queries");
let grouping: typeof import("./law/grouping");
let voteEvents: typeof import("./vote-events");
let seed: typeof import("./seed");
let reset: typeof import("./demo-reset");

// Демо үеэр AI дуудагдвал шууд алдаа
const noAi: AiApi = {
  readAmendment: () => Promise.reject(new Error("AI дуудагдлаа: readAmendment")),
  explainChange: () => Promise.reject(new Error("AI дуудагдлаа: explainChange")),
  filterComments: () => Promise.reject(new Error("AI дуудагдлаа: filterComments")),
  groupComments: () => Promise.reject(new Error("AI дуудагдлаа: groupComments")),
  writeReply: () => Promise.reject(new Error("AI дуудагдлаа: writeReply")),
};

// ParliamentAPI: R1 нь өмнө болсон санал хураалт (replay)
const fakeParliament = {
  async getAgendaList() {
    return [{ agendaCode: "R1", title: "Replay" }];
  },
  async getAgendaVoteList() {
    return [
      {
        customId: "1_1",
        agendaCode: "R1",
        agendaTitle: "Replay",
        meetingId: 1,
        name: "Replay төслийг эцэслэн батлах санал хураалт явуулъя",
        voteType: "Эцэслэн батлах",
        support: 62,
        oppose: 8,
        total: 70,
        present: 70,
        votedAt: null,
      },
    ];
  },
};

const EMAIL = "demo@example.com";

const data: SeedData = {
  bills: [
    {
      key: "demo",
      title: "Хөдөлмөрийн тухай хуульд нэмэлт, өөрчлөлт оруулах тухай",
      summary: "Товч",
      sourceUrl: "https://lawforum.parliament.mn/p/1",
      comparison: [
        {
          number: "14.2",
          oldText: "хуучин заалт",
          newText: "шинэ заалт",
          changeType: "CHANGED",
          sourceQuote: "эшлэл",
          what: "юу",
          why: "яагаад",
          who: "хэнд",
        },
      ],
    },
  ],
  cards: ["a", "b", "c"].map((k, i) => ({
    key: `card-${k}`,
    kind: "CHANGE" as const,
    projectKey: "demo",
    clauseNumber: "14.2",
    emoji: "⏰",
    hook: `Карт ${k}`,
    before: "хуучин заалт",
    after: "шинэ заалт",
    youMeaning: "Чамд.",
    personas: ["STUDENT"],
    sourceUrl: "https://lawforum.parliament.mn/p/1",
    order: i + 1,
    quiz: [{ question: "Асуулт?", options: ["А", "Б", "В"], correctIndex: 1, explanation: "Б" }],
  })),
  voteEvents: [{ agendaCode: "R1", title: "Хөдөлмөрийн хууль", hook: "Дэмжигдэх үү?", isReplay: true }],
  comments: [
    { key: "c1", clauseNumber: "14.2", name: "Бат", vote: "SUPPORT", text: "Дэмжиж байна", filterStatus: "RELEVANT", filterReason: "" },
    { key: "c2", clauseNumber: "14.2", name: "Дорж", vote: "NEUTRAL", text: "Зам засаач", filterStatus: "OFF_TOPIC", filterReason: "сэдвээс гадуур" },
  ],
  groups: [
    { key: "g1", clauseNumber: "14.2", title: "Дэмжсэн", summary: "1 санал", commentKeys: ["c1"], replyDraft: "Баярлалаа", demoReflectable: true },
  ],
};

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
  queries = await import("./law/queries");
  grouping = await import("./law/grouping");
  voteEvents = await import("./vote-events");
  seed = await import("./seed");
  reset = await import("./demo-reset");

  await seed.seedDatabase(data, {
    dataDir: "/no-such-dir",
    demoCitizenEmail: EMAIL,
    demoCitizenComment: "Миний бодит санал",
    staffEmails: ["staff@example.com"],
  });
  // Файлын hook-гүй ч seed хийсэн гарчиг, hook-оор replay-ийн тоог нууцалж хадгална
  const synced = await voteEvents.syncVoteEvents(fakeParliament, []);
  assert.deepEqual([synced.updated, synced.replays], [1, 1]);
});

after(async () => {
  if (!enabled) return;
  await prisma.$disconnect();
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  await c.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
  await c.end();
});

async function runDemo() {
  const citizen = await prisma.user.findFirstOrThrow({ where: { email: EMAIL } });
  const bill = await prisma.project.findUniqueOrThrow({ where: { id: "seed-demo" } });

  // 1. Зочин: /feed (STUDENT) → 3 карт, зөв хариу харагдахгүй
  const cards = await feed.getFeed("STUDENT");
  assert.equal(cards.length, 3);
  assert.ok(!JSON.stringify(cards).includes("correctIndex"));

  // 2. Демо иргэн: 3 карт (+3), асуулт (+3), таамаг (FIRST_PREDICTION)
  for (const c of cards) await points.awardCardView(citizen.id, c.id);
  const quiz = await points.awardQuizAnswer(citizen.id, cards[0].quiz[0].id, 1);
  assert.equal(quiz!.pointsAwarded, 3);
  const [event] = await feed.getVoteEvents();
  assert.equal(event.isReplay, true);
  assert.equal(event.actualSupport, null); // дүн нууц
  const predicted = await points.savePrediction(citizen.id, event.id, true, 60);
  assert.equal(predicted.status, "OK");
  let view = await me.getMe(citizen.id);
  assert.deepEqual([view.points, view.streak], [2 + 3 + 3, 1]); // seed-ийн санал +2
  assert.deepEqual(view.badges.map((b) => b.type), ["FIRST_PREDICTION"]);

  // 3. Ажилтан: "Санал бүлэглэх" — бэлэн бүлэг хэвээр, AI дуудагдахгүй
  await grouping.groupBillComments(bill.id, noAi);
  const demoGroup = await prisma.cluster.findUniqueOrThrow({ where: { id: "seed-g1" }, include: { comments: true } });
  assert.ok(demoGroup.comments.some((c) => c.userId === citizen.id));

  // "Тусгасан" → +50, LAW_CHANGER, мэдэгдэл (reply route-тэй адил дараалал)
  await queries.saveGroupReply("seed-g1", "Таны саналыг тусгалаа.", "REFLECTED");
  assert.equal(await points.awardReflectedForGroup("seed-g1"), 1);

  // 4. Демо иргэн: мэдэгдэл, тэмдэг, /b/[id]
  view = await me.getMe(citizen.id);
  assert.equal(view.points, 8 + 50);
  assert.ok(view.notifications!.some((n) => n.text === "✅ Таны санал хуульд тусгагдлаа"));
  const badge = view.badges.find((b) => b.type === "LAW_CHANGER")!;
  const pub = await feed.getPublicBadge(badge.id);
  assert.equal(pub!.lawTitle, "Хөдөлмөрийн тухай хуульд нэмэлт, өөрчлөлт оруулах тухай");
  assert.equal(pub!.clauseNumber, "14.2");
  assert.equal(view.comments![0].group!.reflection, "REFLECTED");

  // 5. Ажилтан: replay-ийн дүнг зарлана → иргэнд оноо (батлагдах зөв +10, 62-оос 2 зөрсөн +10)
  const found = await voteEvents.findRevealCounts(event.id, fakeParliament);
  assert.equal(found.status, "OK");
  if (found.status !== "OK") return;
  await points.revealVoteEvent(event.id, found.counts);
  view = await me.getMe(citizen.id);
  assert.equal(view.points, 58 + 20);
  assert.equal(view.predictions![0].points, 20);
  assert.ok(view.notifications!.some((n) => n.text === "Таамгийн дүн гарлаа: +20 оноо"));
}

test("демо: 5 алхам бүгд ажиллана, AI дуудагдахгүй", { skip }, async () => {
  await runDemo();
});

test("reset-demo: демог дахин эхнээс нь хийж болно", { skip }, async () => {
  const citizen = await prisma.user.findFirstOrThrow({ where: { email: EMAIL } });
  // Бэлтгэлийн үеэр демо бүртгэлээр нэмэлт санал бичсэн гэж үзье
  await prisma.comment.create({ data: { clauseId: "seed-demo-14.2", userId: citizen.id, body: "туршилт" } });

  const r = await reset.resetDemo({ demoCitizenEmail: EMAIL });
  assert.deepEqual([r.voteEventsReopened, r.groupsReopened, r.cleared.extraComments], [1, 1, 1]);
  assert.deepEqual(r.warnings, []);

  const after = await prisma.user.findUniqueOrThrow({ where: { id: citizen.id } });
  assert.deepEqual([after.points, after.streak, after.lastActiveDate], [2, 0, null]);
  assert.equal(await prisma.badge.count({ where: { userId: citizen.id } }), 0);
  assert.equal((await prisma.voteEvent.findUniqueOrThrow({ where: { agendaCode: "R1" } })).status, "OPEN");
  assert.equal((await prisma.cluster.findUniqueOrThrow({ where: { id: "seed-g1" } })).reflection, "PENDING");
  assert.ok(await prisma.comment.findUnique({ where: { id: "seed-demo-citizen" } }));
  assert.ok(await prisma.comment.findUnique({ where: { id: "seed-c1" } })); // бусдын санал үлдэнэ

  // Нууц тоо хэвээр — дараагийн reveal ParliamentAPI-гүй ажиллана
  const r1 = await prisma.voteEvent.findUniqueOrThrow({ where: { agendaCode: "R1" } });
  assert.deepEqual([r1.hiddenSupport, r1.hiddenOppose, r1.actualSupport], [62, 8, null]);

  // Хоёр дахь удаа яг адилхан ажиллана
  await runDemo();

  // Хоёр удаа reset хийсэн ч оноо хасах руу орохгүй
  await reset.resetDemo({ demoCitizenEmail: EMAIL });
  await reset.resetDemo({ demoCitizenEmail: EMAIL });
  assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: citizen.id } })).points, 2);
});
