// ParliamentAPI, LawForum → DB хуулбар (npm run vote -- sync) ба /api/parliament/*, /api/drafts-ийн уншилтыг
// жинхэнэ DB дээр шалгана: npm run test:db. API-г хуурамч client-ээр солино.
import "dotenv/config";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { Client } from "pg";
import type { ProjectListItem } from "./lawforum";
import type { AgendaVote, Meeting } from "./parliament";

const SCHEMA = process.env.DATABASE_SCHEMA ?? "";
const enabled = /^[a-z0-9_]*(scratch|test)[a-z0-9_]*$/.test(SCHEMA);
const skip = !enabled && "set DATABASE_SCHEMA=<something with scratch or test in the name> to run";

let prisma: typeof import("./prisma").prisma;
let sync: typeof import("./parliament-sync");
let data: typeof import("./parliament-data");
let parliament: typeof import("./parliament");

const TAX = { agendaCode: "20260100027", title: "Татварын тухай хуульд өөрчлөлт оруулах тухай хуулийн төсөл" };
const PENDING = { agendaCode: "20260100150", title: "Хүүхдийн эрхийн тухай хуульд нэмэлт оруулах тухай хуулийн төсөл" };
const BROKEN = { agendaCode: "20260100151", title: "Санал хураалт нь татагдахгүй асуудал" };

function vote(customId: string, name: string, voteType: string, support: number, oppose: number, votedAt: string, agenda = TAX): AgendaVote {
  return {
    customId,
    agendaCode: agenda.agendaCode,
    agendaTitle: agenda.title,
    meetingId: 656,
    name,
    voteType,
    support,
    oppose,
    total: support + oppose,
    present: support + oppose,
    votedAt,
  };
}

// Хуурамч ParliamentAPI. finalSupport-оор дараагийн sync-д тоо өөрчлөгдсөнийг дуурайна.
let finalSupport = 59;
const fakeParliament = {
  async getAgendaList() {
    return [TAX, PENDING, BROKEN];
  },
  async getAgendaVoteList(code: string) {
    if (code === BROKEN.agendaCode) throw new Error("ParliamentAPI getAgendaVoteList: түр алдаа");
    if (code === PENDING.agendaCode) return [];
    return [
      vote("656_1", "Татварын тухай хуульд өөрчлөлт оруулах тухай хуулийн төслийг хэлэлцэх нь зүйтэй гэсэн санал хураалт явуулъя", "Хэлэлцэх эсэх", 70, 30, "2026-07-02T09:00:00.000Z"),
      vote("656_2", "1.Төслийн 1 дүгээр зүйлийг өөрчлөн найруулах", "Эцэслэн батлах", 65, 39, "2026-07-02T09:54:00.000Z"),
      vote("656_3", "Татварын тухай хуульд өөрчлөлт оруулах тухай хуулийн төслийг эцэслэн батлах санал хураалт явуулъя", "Эцэслэн батлах", finalSupport, 45, "2026-07-02T09:56:00.000Z"),
    ];
  },
  async getMeetings(): Promise<Meeting[]> {
    return [
      { id: 656, title: "ЧУУЛГАНЫ НЭГДСЭН ХУРАЛДААН", description: "2026.07.02", startsAt: "2026-07-02T01:00:00.000Z", openedAt: "2026-07-02T02:00:00.000Z", endedAt: null },
      { id: 671, title: "ЧУУЛГАНЫ НЭГДСЭН ХУРАЛДААН", description: "2026.09.07", startsAt: "2026-09-07T01:00:00.000Z", openedAt: null, endedAt: null },
    ];
  },
  async getMembers() {
    return [];
  },
};

const project = (id: number, title: string | null, isActive: boolean): ProjectListItem => ({
  id,
  title,
  projectNumber: `P${id}`,
  typeId: 1,
  typeTitle: "Монгол Улсын хууль",
  categoryId: 1,
  categoryTitle: "Бие даасан",
  status: 1,
  stage: 0,
  publishedOnUtc: `2026-09-2${id % 10}T16:00:00`, // LawForum "Z"-гүй өгдөг — UTC
  isActive,
});
let drafts = [project(1, "МАЛЧНЫ ТУХАЙ ХУУЛЬД ӨӨРЧЛӨЛТ ОРУУЛАХ ТУХАЙ", false), project(2, "Хүүхэд хамгааллын тухай", true), project(3, "  ", false)];
const fakeLawforum = {
  async getAllProjects() {
    return drafts;
  },
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
  sync = await import("./parliament-sync");
  data = await import("./parliament-data");
  parliament = await import("./parliament");
});

after(async () => {
  if (!enabled) return;
  await prisma.$disconnect();
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  await c.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
  await c.end();
});

const query = { q: "", limit: 50, offset: 0 };

test("хоосон DB: route-ууд data/snapshots-оос уншина", { skip }, async () => {
  const agendas = await data.listAgendas(query);
  assert.equal(agendas.source, "snapshot");
  assert.ok(agendas.total > 0, "data/snapshots/getAgendaList.json хоосон — npm run discover");
  // Snapshot-д санал хураалт нь алга асуудлын тоо мэдэгдэхгүй (0 биш)
  assert.ok(agendas.items.some((a) => a.voteCount === null));

  const drafts = await data.listDrafts({ ...query, active: false });
  assert.equal(drafts.source, "snapshot");
  assert.ok(drafts.total > 0);
  assert.equal((await data.listMeetings(query)).source, "snapshot");
});

test("sync: асуудал, санал хураалт, эцсийн санал хураалт; нэг асуудал унавал бусад нь үргэлжилнэ", { skip }, async () => {
  const r = await sync.syncAgendas(fakeParliament);
  assert.deepEqual([r.agendas, r.votes, r.newVotes, r.withFinalVote], [3, 3, 3, 1]);
  assert.deepEqual(r.failed.map((f) => f.agendaCode), [BROKEN.agendaCode]);

  const tax = await prisma.parliamentAgenda.findUniqueOrThrow({ where: { agendaCode: TAX.agendaCode } });
  assert.deepEqual([tax.voteCount, tax.finalVoteId, tax.lastVotedAt?.toISOString()], [3, "656_3", "2026-07-02T09:56:00.000Z"]);
  const pending = await prisma.parliamentAgenda.findUniqueOrThrow({ where: { agendaCode: PENDING.agendaCode } });
  assert.deepEqual([pending.voteCount, pending.finalVoteId, pending.lastVotedAt], [0, null, null]);
  // Санал хураалт нь татагдаагүй асуудлын нэр хадгалагдсан
  assert.equal((await prisma.parliamentAgenda.findUniqueOrThrow({ where: { agendaCode: BROKEN.agendaCode } })).title, BROKEN.title);
});

test("sync: дахин ажиллуулахад давхардахгүй, өөрчлөгдсөн тоог шинэчилнэ", { skip }, async () => {
  const again = await sync.syncAgendas(fakeParliament);
  assert.deepEqual([again.agendas, again.votes, again.newVotes], [3, 3, 0]);
  assert.equal(await prisma.parliamentVote.count(), 3);

  finalSupport = 61; // API-д тоо засагдсан
  await sync.syncAgendas(fakeParliament);
  const final = await prisma.parliamentVote.findUniqueOrThrow({ where: { agendaCode_customId: { agendaCode: TAX.agendaCode, customId: "656_3" } } });
  assert.deepEqual([final.support, final.oppose, final.total], [61, 45, 106]);
  assert.equal(await prisma.parliamentVote.count(), 3);
});

test("sync: хуралдаан, гишүүд, LawForum-ын төслүүд (UTC огноо, гарчиггүйг алгасна)", { skip }, async () => {
  assert.equal(await sync.syncMeetings("2024-01-01", "2026-12-31", fakeParliament), 2);
  assert.equal(await sync.syncMeetings("2024-01-01", "2026-12-31", fakeParliament), 2);
  assert.equal(await prisma.parliamentMeeting.count(), 2);
  assert.equal(await sync.syncMembers(fakeParliament), 0);

  assert.deepEqual(await sync.syncLawDrafts(fakeLawforum), { drafts: 2, newDrafts: 2, active: 1 });
  const first = await prisma.lawDraft.findUniqueOrThrow({ where: { id: 1 } });
  assert.equal(first.publishedAt?.toISOString(), "2026-09-21T16:00:00.000Z");

  drafts = [project(1, "МАЛЧНЫ ТУХАЙ ХУУЛЬД ӨӨРЧЛӨЛТ ОРУУЛАХ ТУХАЙ", true), ...drafts.slice(1)];
  assert.deepEqual(await sync.syncLawDrafts(fakeLawforum), { drafts: 2, newDrafts: 0, active: 2 });
  assert.equal((await prisma.lawDraft.findUniqueOrThrow({ where: { id: 1 } })).isActive, true);
  assert.equal(await prisma.lawDraft.count(), 2);
});

test("route-ууд DB-ээс: эцсийн санал хураалт, хайлт, хуудаслалт; гишүүн бүрийн санал огт алга", { skip }, async () => {
  const agendas = await data.listAgendas(query);
  assert.equal(agendas.source, "db");
  assert.equal(agendas.total, 3);
  // Сүүлд санал хураасан нь эхэнд
  assert.equal(agendas.items[0].agendaCode, TAX.agendaCode);
  assert.deepEqual(agendas.items[0].finalVote, {
    customId: "656_3",
    agendaCode: TAX.agendaCode,
    meetingId: 656,
    name: "Татварын тухай хуульд өөрчлөлт оруулах тухай хуулийн төслийг эцэслэн батлах санал хураалт явуулъя",
    voteType: "Эцэслэн батлах",
    support: 61,
    oppose: 45,
    total: 106,
    present: 106,
    votedAt: "2026-07-02T09:56:00.000Z",
    supportMajority: true,
  });

  const found = await data.listAgendas({ ...query, q: "хүүхдийн" });
  assert.deepEqual(found.items.map((a) => a.agendaCode), [PENDING.agendaCode]);
  assert.equal((await data.listAgendas({ ...query, limit: 1, offset: 1 })).items.length, 1);

  const detail = await data.getAgenda(TAX.agendaCode);
  assert.deepEqual(detail?.votes?.map((v) => v.customId), ["656_1", "656_2", "656_3"]);
  assert.equal(await data.getAgenda("20990100001"), null);

  const meeting = await data.getMeeting(656);
  assert.deepEqual(meeting?.votes?.map((v) => v.customId), ["656_1", "656_2", "656_3"]);
  assert.equal((await data.listMeetings(query)).items[0].id, 671); // шинэ нь эхэнд

  const active = await data.listDrafts({ ...query, active: true });
  assert.deepEqual([active.source, active.total], ["db", 2]);
  assert.equal(active.items[0].url, "https://lawforum.parliament.mn/project/2");

  // Хариунд гишүүний нэр, санал ("Зөвшөөрсөн") хэзээ ч орохгүй
  assert.doesNotMatch(JSON.stringify([agendas, detail, meeting]), /Зөвшөөрсөн|Татгалзсан|middleName/);
});

test("finalReadingVote: DB-ийн хуулбар client-ийн дүрмийг ашиглана", { skip }, async () => {
  const votes = await fakeParliament.getAgendaVoteList(TAX.agendaCode);
  assert.equal(parliament.finalReadingVote(votes)?.customId, "656_3");
});
