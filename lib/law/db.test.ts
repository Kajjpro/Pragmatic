import "dotenv/config";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { Client } from "pg";
import type { AiApi } from "./ai";
import type { WordPart } from "./types";

const SCHEMA = process.env.DATABASE_SCHEMA ?? "";
const enabled = /^[a-z0-9_]*(scratch|test)[a-z0-9_]*$/.test(SCHEMA);
const skip = !enabled && "set DATABASE_SCHEMA=<something with scratch or test in the name> to run";

const sample = readFileSync(new URL("./fixtures/sample-law.txt", import.meta.url), "utf8");

const CHANGES = [
  { type: "REPLACE_WORDS", number: "2.2", oldWords: "эрхтэй байна", newText: "эрхтэй байж болно", sourceQuote: "«байна» гэснийг «байж болно» гэж өөрчилсүгэй" },
  { type: "ADD", number: "2.3", newText: "Шинэ заалт нэмэв.", sourceQuote: "2.3 дахь заалтыг нэмсүгэй" },
  { type: "REMOVE", number: "1.1", sourceQuote: "1.1 дэх заалтыг хассугай" },
  { type: "REPLACE_WORDS", number: "4.1", oldWords: "олдохгүй үг", newText: "х", sourceQuote: "4.1 дэх заалт" },
] as const;

const explainNumbers: (string | undefined)[] = [];
let filterInputs: string[] = [];

const fakeAi: AiApi = {
  async readAmendment() {
    return [...CHANGES];
  },
  async explainChange(_o, _n, reason, number) {
    explainNumbers.push(number);
    return { what: "юу", why: `яагаад: ${reason}`, who: "хэнд" };
  },
  async filterComments(_t, comments) {
    filterInputs.push(...comments.map((c) => c.text));
    return comments.map((c) =>
      c.text.includes("Сэдвээс гадуур")
        ? { id: c.id, status: "OFF_TOPIC" as const, reason: "хуультай хамааралгүй" }
        : c.text.includes("Доромж")
          ? { id: c.id, status: "ABUSIVE" as const, reason: "доромжилсон" }
          : { id: c.id, status: "RELEVANT" as const, reason: "" },
    );
  },
  async groupComments(_t, comments) {
    return [{ title: "Бүлэг А", summary: "хураангуй", commentIds: [comments[0].id, "no-such-id"] }];
  },
  async writeReply(_t, g) {
    return `Ноорог: ${g.title}`;
  },
};

type Prisma = typeof import("@/lib/prisma").prisma;
let prisma: Prisma;
let q: typeof import("./queries");
let pipeline: typeof import("./pipeline");
let grouping: typeof import("./grouping");
let seedLib: typeof import("./seed");
let word: typeof import("../word");

const s = { billId: "", userId: "", clause22: "", groupA: "", offTopicId: "", abusiveId: "" };
const tmpDirs: string[] = [];

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

  prisma = (await import("@/lib/prisma")).prisma;
  q = await import("./queries");
  pipeline = await import("./pipeline");
  grouping = await import("./grouping");
  seedLib = await import("./seed");
  word = await import("../word");
});

after(async () => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
  if (!enabled) return;
  await prisma.$disconnect();
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  await c.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
  await c.end();
});

test("createBill: saves stage, clauses, diffs, sources and explanations (AI only for changed clauses)", { skip }, async () => {
  const r = await pipeline.createBill(
    { title: "Тест төсөл", stage: "FINAL_READING", currentLawText: sample, amendmentText: "төслийн текст", reasonText: "тайлбар" },
    fakeAi,
  );
  s.billId = r.id;
  assert.equal(r.clauses, 13);
  assert.equal(r.changed, 4);
  assert.deepEqual([...explainNumbers].sort(), ["1.1", "2.2", "2.3", "4.1"]);

  const bill = await prisma.project.findUniqueOrThrow({ where: { id: s.billId } });
  assert.equal(bill.stage, "FINAL_READING");

  const clauses = await prisma.clause.findMany({ where: { projectId: s.billId }, orderBy: { order: "asc" } });
  assert.deepEqual(
    clauses.map((c) => c.number),
    ["1", "1.1", "2", "2.1", "2.1.1", "2.1.2", "2.2", "2.3", "3", "4", "4.1", "4.9", "4.10"],
  );

  const c22 = clauses.find((c) => c.number === "2.2")!;
  s.clause22 = c22.id;
  assert.equal(c22.changeType, "CHANGED");
  assert.equal(c22.oldText, "Засгийн газар журмыг батлах эрхтэй байна.");
  assert.equal(c22.newText, "Засгийн газар журмыг батлах эрхтэй байж болно.");
  const diff = c22.diff as unknown as WordPart[];
  assert.ok(diff.some((p) => p.removed && p.value === "байна"));
  assert.ok(diff.some((p) => p.added && p.value === "байж болно"));
  assert.equal(c22.sourceQuote, "«байна» гэснийг «байж болно» гэж өөрчилсүгэй");
  assert.deepEqual([c22.what, c22.why, c22.who], ["юу", "яагаад: тайлбар", "хэнд"]);
  assert.equal(c22.approved, false);

  assert.equal(clauses.find((c) => c.number === "2.3")!.changeType, "ADDED");
  assert.equal(clauses.find((c) => c.number === "1.1")!.changeType, "REMOVED");
  const bad = clauses.find((c) => c.number === "4.1")!;
  assert.equal(bad.applyError, true);
  assert.equal(bad.newText, bad.oldText);
  assert.equal(clauses.find((c) => c.number === "3")!.changeType, "UNCHANGED");
});

test("bill view has exactly the shape of the shared types; citizens see nothing until approval", { skip }, async () => {
  assert.equal(await q.getBillView(s.billId, false), null);
  assert.deepEqual((await q.getBillList(false)).map((b) => b.id), []);

  const staff = (await q.getBillView(s.billId, true))!;
  assert.deepEqual(Object.keys(staff).sort(), ["clauses", "id", "reasonText", "stage", "title"]);
  assert.equal(staff.stage, "FINAL_READING");
  assert.equal(staff.clauses.length, 4);
  const c22 = staff.clauses.find((c) => c.number === "2.2")!;
  assert.deepEqual(Object.keys(c22).sort(), [
    "approved", "changeType", "diff", "filtered", "groups", "id", "newText", "number",
    "oldText", "sourceQuote", "what", "who", "why",
  ]);
  assert.equal(c22.sourceQuote, "«байна» гэснийг «байж болно» гэж өөрчилсүгэй");
  assert.deepEqual(c22.groups, []);
  assert.deepEqual(c22.filtered, []);

  const [summary] = await q.getBillList(true);
  assert.deepEqual(Object.keys(summary).sort(), [
    "changedCount", "commentCount", "filteredCount", "id", "stage", "title", "unansweredGroupCount", "unapprovedCount",
  ]);
  assert.deepEqual(
    [summary.changedCount, summary.unapprovedCount, summary.commentCount, summary.unansweredGroupCount, summary.filteredCount],
    [4, 4, 0, 0, 0],
  );

  const r = await prisma.clause.updateMany({
    where: { projectId: s.billId, changeType: { not: "UNCHANGED" }, applyError: false },
    data: { approved: true },
  });
  assert.equal(r.count, 3);

  const citizen = (await q.getBillView(s.billId, false))!;
  assert.deepEqual(citizen.clauses.map((c) => c.number), ["1.1", "2.2", "2.3"]);
  const cc = citizen.clauses.find((c) => c.number === "2.2")!;
  assert.equal(cc.what, "юу");
  assert.equal(cc.sourceQuote, null);
  assert.deepEqual(cc.filtered, []);
  assert.equal((await q.getBillList(false))[0].changedCount, 3);
  assert.equal((await q.getBillList(true))[0].unapprovedCount, 1);
});

test("filter: irrelevant comments are labelled and kept (never deleted), only relevant ones are grouped", { skip }, async () => {
  s.userId = (await prisma.user.create({ data: { clerkId: "test_user" } })).id;
  for (const body of ["Нэг санал", "Хоёр санал", "Гурав санал", "Сэдвээс гадуур: хоолны газар", "Доромж үг бичсэн"]) {
    await prisma.comment.create({ data: { clauseId: s.clause22, userId: s.userId, body } });
    await new Promise((r) => setTimeout(r, 5));
  }
  await prisma.comment.create({ data: { clauseId: s.clause22, body: "Спам", suspicious: true } });

  filterInputs = [];
  const r = await grouping.groupBillComments(s.billId, fakeAi);
  assert.deepEqual(r, { clauses: 1, groups: 2, filtered: 2 });
  assert.deepEqual(filterInputs, ["Нэг санал", "Хоёр санал", "Гурав санал", "Сэдвээс гадуур: хоолны газар", "Доромж үг бичсэн"]);

  assert.equal(await prisma.comment.count({ where: { clauseId: s.clause22 } }), 6);

  const off = await prisma.comment.findFirstOrThrow({ where: { body: { startsWith: "Сэдвээс" } } });
  const abuse = await prisma.comment.findFirstOrThrow({ where: { body: { startsWith: "Доромж" } } });
  s.offTopicId = off.id;
  s.abusiveId = abuse.id;
  assert.deepEqual([off.filterStatus, off.filterReason, off.clusterId], ["OFF_TOPIC", "хуультай хамааралгүй", null]);
  assert.deepEqual([abuse.filterStatus, abuse.filterReason, abuse.clusterId], ["ABUSIVE", "доромжилсон", null]);

  const groups = await prisma.cluster.findMany({
    where: { clauseId: s.clause22 },
    include: { comments: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  assert.deepEqual(groups.map((g) => g.label), ["Бүлэг А", "Бусад санал"]);
  assert.deepEqual(groups[0].comments.map((c) => c.body), ["Нэг санал"]);
  assert.deepEqual(groups[1].comments.map((c) => c.body), ["Хоёр санал", "Гурав санал"]);
  assert.equal(groups[0].replyDraft, "Ноорог: Бүлэг А");
  s.groupA = groups[0].id;

  const spam = await prisma.comment.findFirstOrThrow({ where: { body: "Спам" } });
  assert.deepEqual([spam.clusterId, spam.filterStatus], [null, null]);
});

test("staff see the filtered list and counts; citizens do not", { skip }, async () => {
  const staff = (await q.getBillView(s.billId, true))!;
  const c22 = staff.clauses.find((c) => c.number === "2.2")!;
  assert.deepEqual(
    c22.filtered.map((f) => [f.text, f.filterStatus, f.filterReason]),
    [
      ["Сэдвээс гадуур: хоолны газар", "OFF_TOPIC", "хуультай хамааралгүй"],
      ["Доромж үг бичсэн", "ABUSIVE", "доромжилсон"],
    ],
  );
  assert.deepEqual(Object.keys(c22.filtered[0]).sort(), ["filterReason", "filterStatus", "id", "text"]);
  assert.equal(c22.groups.length, 2);
  assert.deepEqual(Object.keys(c22.groups[0]).sort(), [
    "commentCount", "id", "reflection", "replyDraft", "replyText", "summary", "title",
  ]);
  assert.equal(c22.groups[0].replyDraft, "Ноорог: Бүлэг А");

  const [summary] = await q.getBillList(true);
  assert.equal(summary.filteredCount, 2);
  assert.equal(summary.commentCount + summary.filteredCount, 6);
  assert.equal(summary.unansweredGroupCount, 2);

  const citizen = (await q.getBillView(s.billId, false))!;
  const cc = citizen.clauses.find((c) => c.number === "2.2")!;
  assert.deepEqual(cc.filtered, []);
  assert.deepEqual(cc.groups, []);
  const [citizenSummary] = await q.getBillList(false);
  assert.deepEqual([citizenSummary.filteredCount, citizenSummary.unansweredGroupCount], [0, 0]);
});

test("my comments: reflection is PENDING and the answer hidden until staff reply", { skip }, async () => {
  const mine = await q.getMyComments(s.userId);
  assert.equal(mine.length, 5);
  const grouped = mine.filter((m) => m.group);
  assert.equal(grouped.length, 3);
  for (const m of grouped) {
    assert.equal(m.group!.reflection, "PENDING");
    assert.equal(m.group!.replyText, null);
    assert.equal(m.clause.number, "2.2");
    assert.ok((m.clause.diff as unknown as WordPart[]).some((p) => p.added));
  }
  assert.equal(mine.filter((m) => !m.group).length, 2);
});

test("restore: a filtered comment goes back to RELEVANT and joins the next grouping without being filtered again", { skip }, async () => {
  assert.equal(await q.restoreComment("no-such-comment"), null);
  const relevant = await prisma.comment.findFirstOrThrow({ where: { body: "Нэг санал" } });
  assert.deepEqual(await q.restoreComment(relevant.id), { id: relevant.id, restored: false });

  assert.deepEqual(await q.restoreComment(s.offTopicId), { id: s.offTopicId, restored: true });
  assert.deepEqual(await q.restoreComment(s.offTopicId), { id: s.offTopicId, restored: true });
  const c = await prisma.comment.findUniqueOrThrow({ where: { id: s.offTopicId } });
  assert.deepEqual([c.filterStatus, c.restored, c.filterReason], ["RELEVANT", true, "хуультай хамааралгүй"]);

  const staff = (await q.getBillView(s.billId, true))!;
  assert.deepEqual(staff.clauses.find((x) => x.number === "2.2")!.filtered.map((f) => f.text), ["Доромж үг бичсэн"]);

  filterInputs = [];
  await grouping.groupBillComments(s.billId, fakeAi);
  assert.deepEqual(filterInputs, []);
  const joined = await prisma.comment.findUniqueOrThrow({ where: { id: s.offTopicId } });
  assert.notEqual(joined.clusterId, null);
  assert.equal(await prisma.comment.count({ where: { clauseId: s.clause22 } }), 6);

  assert.equal(await prisma.cluster.count({ where: { id: s.groupA } }), 0);
  s.groupA = (await prisma.cluster.findFirstOrThrow({ where: { clauseId: s.clause22, label: "Бүлэг А" } })).id;
});

test("reply: the citizen sees the outcome together with the clause change", { skip }, async () => {
  const saved = await q.saveGroupReply(s.groupA, "Таны саналыг хуульд тусгалаа.", "REFLECTED");
  assert.equal(saved!.reflection, "REFLECTED");
  assert.ok(saved!.repliedAt);
  assert.equal(await q.saveGroupReply("no-such-group", "x", "REFLECTED"), null);

  const mine = await q.getMyComments(s.userId);
  const answered = mine.find((m) => m.text === "Нэг санал")!;
  assert.equal(answered.group!.reflection, "REFLECTED");
  assert.equal(answered.group!.replyText, "Таны саналыг хуульд тусгалаа.");
  assert.equal(answered.clause.newText, "Засгийн газар журмыг батлах эрхтэй байж болно.");

  const citizen = (await q.getBillView(s.billId, false))!;
  const groups = citizen.clauses.find((c) => c.number === "2.2")!.groups;
  assert.equal(groups.length, 1);
  assert.deepEqual([groups[0].reflection, groups[0].replyText, groups[0].replyDraft], ["REFLECTED", "Таны саналыг хуульд тусгалаа.", null]);
});

test("group again: answered groups are kept, unanswered ones are rebuilt with the new comment", { skip }, async () => {
  await prisma.comment.create({ data: { clauseId: s.clause22, userId: s.userId, body: "Дөрөв санал" } });
  await grouping.groupBillComments(s.billId, fakeAi);

  const groups = await prisma.cluster.findMany({ where: { clauseId: s.clause22 }, include: { comments: true } });
  const answered = groups.find((g) => g.id === s.groupA)!;
  assert.equal(answered.status, "ANSWERED");
  assert.deepEqual(answered.comments.map((c) => c.body), ["Нэг санал"]);

  const rest = groups.filter((g) => g.id !== s.groupA);
  assert.deepEqual(
    rest.flatMap((g) => g.comments.map((c) => c.body)).sort(),
    ["Гурав санал", "Дөрөв санал", "Сэдвээс гадуур: хоолны газар", "Хоёр санал"],
  );
  const ungroupedRelevant = await prisma.comment.count({
    where: { clauseId: s.clause22, clusterId: null, suspicious: false, filterStatus: "RELEVANT" },
  });
  assert.equal(ungroupedRelevant, 0);
  assert.equal(await prisma.comment.count({ where: { clauseId: s.clause22 } }), 7);
});

test("word: the file is built from the saved rows", { skip }, async () => {
  const bill = await prisma.project.findUniqueOrThrow({
    where: { id: s.billId },
    select: { title: true, clauses: { where: { changeType: { not: "UNCHANGED" } }, orderBy: { order: "asc" }, select: { number: true, oldText: true, newText: true, changeType: true, diff: true } } },
  });
  const buf = await word.makeWordFile({
    title: bill.title,
    clauses: bill.clauses.map((c) => ({ ...c, diff: c.diff as unknown as WordPart[] })),
  });
  assert.equal(buf.subarray(0, 2).toString(), "PK");
});

function makeDataDir() {
  const dir = mkdtempSync(join(tmpdir(), "seed-test-"));
  tmpDirs.push(dir);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "law.txt"), sample);
  writeFileSync(join(dir, "bill.txt"), "Seed тест төсөл\nтөслийн текст");
  writeFileSync(join(dir, "reason.txt"), "тайлбар");
  writeFileSync(
    join(dir, "comments.json"),
    JSON.stringify([
      { clause: "2.2", text: "Дэмжиж байна", name: "Бат" },
      { clause: "2.2", text: "Сэдвээс гадуур мэдээлэл", name: "Дорж" },
      { clause: "2.2", text: "Хэрэгжүүлэхэд хэцүү", vote: "OPPOSE" },
      { clause: "9.9", text: "Байхгүй заалт" },
    ]),
  );
  writeFileSync(
    join(dir, "results.json"),
    JSON.stringify({
      changes: CHANGES,
      explanations: { "2.2": { what: "Заавал биш болсон", why: "Уян хатан байх", who: "Засгийн газар" } },
      filter: [{ comment: 1, status: "OFF_TOPIC", reason: "хамааралгүй" }],
      groups: [{ clause: "2.2", title: "Дэмжсэн саналууд", summary: "1 санал", comments: [0], replyDraft: "Баярлалаа" },
               { clause: "2.2", title: "Хэрэгжилтийн эрсдэл", summary: "1 санал", comments: [2], replyDraft: "Анхаарна" }],
    }),
  );
  return dir;
}

test("seed: loads data/results.json instead of calling the AI and saves everything precomputed", { skip }, async () => {
  const dir = makeDataDir();
  const r = await seedLib.seedFromFiles({ dataDir: dir, stage: "FIRST_READING" });

  assert.equal(r.aiSource, "data/results.json");
  assert.deepEqual([r.clauses, r.changed, r.approved, r.needCheck], [13, 4, 3, ["4.1"]]);
  assert.deepEqual([r.commentsSaved, r.commentsSkipped, r.groups, r.filtered], [3, 1, 2, 1]);

  const bill = (await q.getBillView(r.billId, true))!;
  assert.equal(bill.stage, "FIRST_READING");
  const c22 = bill.clauses.find((c) => c.number === "2.2")!;
  assert.deepEqual([c22.what, c22.why, c22.who], ["Заавал биш болсон", "Уян хатан байх", "Засгийн газар"]);
  assert.deepEqual(c22.groups.map((g) => [g.title, g.replyDraft]), [["Дэмжсэн саналууд", "Баярлалаа"], ["Хэрэгжилтийн эрсдэл", "Анхаарна"]]);
  assert.deepEqual(c22.filtered.map((f) => [f.text, f.filterStatus]), [["Сэдвээс гадуур мэдээлэл", "OFF_TOPIC"]]);
  const oppose = await prisma.comment.findFirstOrThrow({ where: { body: "Хэрэгжүүлэхэд хэцүү" } });
  assert.equal(oppose.vote, "OPPOSE");

  await assert.rejects(seedLib.seedFromFiles({ dataDir: dir }), /already exists/);
  const again = await seedLib.seedFromFiles({ dataDir: dir, replace: true });
  assert.notEqual(again.billId, r.billId);
  assert.equal(await prisma.project.count({ where: { title: "Seed тест төсөл" } }), 1);
});

test("seed: a broken results.json gives a clear error", { skip }, async () => {
  const dir = makeDataDir();
  writeFileSync(join(dir, "results.json"), '{"nothing": true}');
  await assert.rejects(seedLib.seedFromFiles({ dataDir: dir, replace: true }), /needs a "changes" array/);
  writeFileSync(join(dir, "results.json"), "not json");
  await assert.rejects(seedLib.seedFromFiles({ dataDir: dir, replace: true }), /not valid JSON/);
});
