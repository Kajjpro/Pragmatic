// data/precomputed.json (Dev 2) → DB. AI ОГТ дуудахгүй — бүх AI үр дүн файлд бэлэн байна.
// Дахин ажиллуулж болно (idempotent): мөр бүр тогтмол id-тай тул дахин үүсгэхгүй, шинэчилнэ.
// Хэлбэр нь Dev 2-ийн lib/ai/precomputed.ts-тэй ижил.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Prisma } from "@/app/generated/prisma/client";
import { compareWords } from "@/lib/law/compare";
import { STAGES, type FilterStatus, type Stage } from "@/lib/law/types";
import { awardRelevantComment } from "@/lib/points";
import { prisma } from "@/lib/prisma";
import { PERSONAS, type Persona } from "@/lib/types";

// ───────────── Файлын хэлбэр ─────────────

export type SeedClause = {
  number: string;
  oldText: string | null;
  newText: string | null;
  changeType: "ADDED" | "REMOVED" | "CHANGED";
  sourceQuote: string | null;
  what: string | null;
  why: string | null;
  who: string | null;
};

export type SeedData = {
  bills: { key: string; lawforumId?: number; title: string; summary: string; sourceUrl: string; comparison?: SeedClause[] }[];
  cards: {
    key: string;
    kind: "BILL" | "CHANGE";
    projectKey: string;
    clauseNumber?: string;
    emoji: string;
    hook: string;
    before?: string | null;
    after?: string | null;
    youMeaning: string;
    personas: string[];
    sourceUrl: string;
    sourceQuote?: string | null; // төслөөс яг хуулсан өгүүлбэр (картын «Ийм болно»)
    order: number;
    quiz: { question: string; options: string[]; correctIndex: number; explanation: string }[];
  }[];
  voteEvents: { agendaCode: string; title: string; hook: string; isReplay: boolean }[];
  comments: { key: string; clauseNumber: string; name: string; vote: string; text: string; filterStatus: string; filterReason: string }[];
  groups: { key: string; clauseNumber: string; title: string; summary: string; commentKeys: string[]; replyDraft: string; demoReflectable: boolean }[];
};

// Файлыг уншиж, үндсэн хэлбэрийг шалгана. Буруу бол ойлгомжтой алдаа.
export function parseSeedData(raw: string): SeedData {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("data/precomputed.json зөв JSON биш байна");
  }
  const d = data as Partial<SeedData> | null;
  for (const key of ["bills", "cards", "voteEvents", "comments", "groups"] as const) {
    if (!d || !Array.isArray(d[key])) throw new Error(`data/precomputed.json: "${key}" массив байх ёстой`);
  }
  return d as SeedData;
}

// ───────────── Тохиргоо ба тайлан ─────────────

export type SeedOptions = {
  dataDir?: string; // law.txt, bill.txt, reason.txt, stage.txt байрлах хавтас
  demoCitizenEmail?: string;
  demoCitizenComment?: string; // демо иргэний санал (багийн гишүүний бодит санал)
  staffEmails?: string[];
};

export type SeedReport = {
  bills: number;
  clauses: number;
  cards: number;
  questions: number;
  voteEvents: number;
  comments: number;
  filtered: number;
  groups: number;
  demoCitizen: string | null;
  staff: string[];
  warnings: string[];
};

// Тогтмол id-ууд — дахин ажиллуулахад ижил мөрийг олно
const projectId = (billKey: string) => `seed-${billKey}`;
const clauseId = (billKey: string, number: string) => `seed-${billKey}-${number}`;
const questionId = (cardKey: string, index: number) => `${cardKey}-q${index + 1}`;
const commentId = (key: string) => `seed-${key}`;
const groupId = (key: string) => `seed-${key}`;
export const DEMO_COMMENT_ID = "seed-demo-citizen"; // демо иргэний санал (reset-demo ч ашиглана)

const VOTES = ["SUPPORT", "OPPOSE", "NEUTRAL"] as const;
const FILTER_STATUSES: FilterStatus[] = ["RELEVANT", "OFF_TOPIC", "ABUSIVE", "DUPLICATE"];

function readText(dir: string, name: string): string | null {
  const path = join(dir, name);
  return existsSync(path) ? readFileSync(path, "utf8").trim() : null;
}

// ───────────── Seed ─────────────

export async function seedDatabase(data: SeedData, opts: SeedOptions = {}): Promise<SeedReport> {
  const dir = opts.dataDir ?? "data";
  const report: SeedReport = {
    bills: 0, clauses: 0, cards: 0, questions: 0, voteEvents: 0, comments: 0, filtered: 0, groups: 0,
    demoCitizen: null, staff: [], warnings: [],
  };
  const warn = (text: string) => report.warnings.push(text);

  // 1. Төслүүд ба заалтууд. Харьцуулалттай төсөл (демо) л хуулийн текст, заалттай.
  const demoBill = data.bills.find((b) => b.comparison && b.comparison.length > 0) ?? null;
  const stageText = readText(dir, "stage.txt");
  const demoStage: Stage = STAGES.includes(stageText as Stage) ? (stageText as Stage) : "FIRST_READING";

  const projectIdByKey = new Map<string, string>(); // төслийн key → DB id
  for (const bill of data.bills) {
    const isDemo = bill === demoBill;
    const fields = {
      title: bill.title,
      description: bill.summary || null,
      slugUrl: bill.sourceUrl || null,
      source: bill.lawforumId ? ("LAWFORUM" as const) : ("UPLOAD" as const),
      stage: isDemo ? demoStage : ("DISCUSS_DECISION" as const),
      // Төслийн жагсаалт зөвхөн хуулийн тексттэй (харьцуулалттай) төслийг харуулна
      currentLawText: isDemo ? readText(dir, "law.txt") : null,
      amendmentText: isDemo ? (readText(dir, "bill.txt") ?? bill.title) : null,
      reasonText: isDemo ? readText(dir, "reason.txt") : null,
    };
    // lawforum-ын төсөл өмнө нь өөр id-тай орсон байж болох тул lawforumId-аар хайна
    const project = await prisma.project.upsert({
      where: bill.lawforumId ? { lawforumId: bill.lawforumId } : { id: projectId(bill.key) },
      create: { id: projectId(bill.key), lawforumId: bill.lawforumId ?? null, ...fields },
      update: fields,
      select: { id: true },
    });
    projectIdByKey.set(bill.key, project.id);
    report.bills++;

    for (const [order, c] of (bill.comparison ?? []).entries()) {
      const id = clauseId(bill.key, c.number);
      const fields = {
        number: c.number,
        order,
        oldText: c.oldText,
        newText: c.newText,
        changeType: c.changeType,
        diff: compareWords(c.oldText, c.newText) as unknown as Prisma.InputJsonValue,
        sourceQuote: c.sourceQuote,
        what: c.what,
        why: c.why,
        who: c.who,
        applyError: false,
        approved: true, // Dev 2 review.md-ээр гараар шалгасан
      };
      await prisma.clause.upsert({
        where: { id },
        create: { id, projectId: project.id, ...fields },
        update: fields,
      });
      report.clauses++;
    }
  }

  // 2. Картууд ба асуултууд
  const cardKeys: string[] = [];
  for (const card of data.cards) {
    const project = projectIdByKey.get(card.projectKey) ?? null;
    if (!project) warn(`карт ${card.key}: төсөл "${card.projectKey}" алга — төсөлгүй хадгаллаа`);
    if (!card.sourceUrl) warn(`карт ${card.key}: sourceUrl хоосон`);

    const clause =
      card.clauseNumber && demoBill && card.projectKey === demoBill.key
        ? await prisma.clause.findUnique({ where: { id: clauseId(demoBill.key, card.clauseNumber) }, select: { id: true } })
        : null;
    const personas = card.personas.filter((p): p is Persona => (PERSONAS as readonly string[]).includes(p));

    const fields = {
      kind: card.kind,
      emoji: card.emoji,
      hook: card.hook,
      before: card.before ?? null,
      after: card.after ?? null,
      youMeaning: card.youMeaning,
      sourceQuote: card.sourceQuote?.trim() || null,
      personas: personas.length > 0 ? personas : (["ALL"] as Persona[]),
      sourceUrl: card.sourceUrl,
      order: card.order,
      projectId: project,
      clauseId: clause?.id ?? null,
    };
    await prisma.card.upsert({ where: { id: card.key }, create: { id: card.key, ...fields }, update: fields });
    cardKeys.push(card.key);
    report.cards++;

    // Асуулт бүр: зөв хариуны дугаар сонголтын тоонд багтах ёстой
    const questionIds: string[] = [];
    for (const [index, q] of card.quiz.entries()) {
      const optionsOk = Array.isArray(q.options) && q.options.length >= 2 && q.options.every((o) => typeof o === "string");
      if (!optionsOk || !Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
        warn(`карт ${card.key}: ${index + 1}-р асуулт буруу хэлбэртэй — алгаслаа`);
        continue;
      }
      const id = questionId(card.key, index);
      const qFields = { order: index, question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation };
      await prisma.quizQuestion.upsert({ where: { id }, create: { id, cardId: card.key, ...qFields }, update: qFields });
      questionIds.push(id);
      report.questions++;
    }
    // Файлаас хасагдсан асуултуудыг устгана
    await prisma.quizQuestion.deleteMany({ where: { cardId: card.key, id: { notIn: questionIds } } });
  }
  // Файлаас хасагдсан картуудыг устгана (Dev 2-ийн review-ээр хасагдсан)
  await prisma.card.deleteMany({ where: { id: { notIn: cardKeys } } });

  // 3. Санал хураалтын таамаг. Тоо (hidden*) ба isReplay-г sync өөрчилнө — энд зөвхөн гарчиг, hook.
  for (const ev of data.voteEvents) {
    const project = await prisma.project.findFirst({ where: { agendaCode: ev.agendaCode }, select: { id: true } });
    await prisma.voteEvent.upsert({
      where: { agendaCode: ev.agendaCode },
      create: { agendaCode: ev.agendaCode, title: ev.title, hook: ev.hook, isReplay: ev.isReplay, status: "OPEN", projectId: project?.id ?? null },
      update: { title: ev.title, hook: ev.hook, projectId: project?.id ?? null },
    });
    report.voteEvents++;
  }
  const replaysWithoutNumbers = await prisma.voteEvent.count({
    where: { isReplay: true, status: "OPEN", hiddenSupport: null },
  });
  if (replaysWithoutNumbers > 0) {
    warn(`${replaysWithoutNumbers} replay санал хураалтад тоо алга — /api/staff/vote-events/sync ажиллуулна уу`);
  }

  // 4. Демо төслийн санал, бүлэг (AI шүүлт, бүлэглэлт, хариуны ноорог бэлэн)
  const groupIdByComment = new Map<string, string>();
  const seededGroups = new Set<string>();
  if (demoBill) {
    const clauseNumbers = new Set((demoBill.comparison ?? []).map((c) => c.number));

    for (const g of data.groups) {
      if (!clauseNumbers.has(g.clauseNumber)) {
        warn(`бүлэг ${g.key}: заалт ${g.clauseNumber} харьцуулалтад алга — алгаслаа`);
        continue;
      }
      const id = groupId(g.key);
      const fields = { clauseId: clauseId(demoBill.key, g.clauseNumber), label: g.title, summary: g.summary, replyDraft: g.replyDraft };
      // Ажилтны өгсөн хариу (replyText, reflection)-г хөндөхгүй
      await prisma.cluster.upsert({ where: { id }, create: { id, ...fields }, update: fields });
      for (const key of g.commentKeys) groupIdByComment.set(key, id);
      seededGroups.add(g.key);
      report.groups++;
    }

    for (const c of data.comments) {
      if (!clauseNumbers.has(c.clauseNumber)) {
        warn(`санал ${c.key}: заалт ${c.clauseNumber} харьцуулалтад алга — алгаслаа`);
        continue;
      }
      const status = FILTER_STATUSES.includes(c.filterStatus as FilterStatus) ? (c.filterStatus as FilterStatus) : "RELEVANT";
      const id = commentId(c.key);
      const fields = {
        clauseId: clauseId(demoBill.key, c.clauseNumber),
        body: c.text,
        petitionerName: c.name || null,
        vote: (VOTES as readonly string[]).includes(c.vote) ? (c.vote as (typeof VOTES)[number]) : "NEUTRAL",
        filterStatus: status,
        filterReason: c.filterReason || null,
        clusterId: status === "RELEVANT" ? (groupIdByComment.get(c.key) ?? null) : null,
      };
      await prisma.comment.upsert({ where: { id }, create: { id, ...fields }, update: fields });
      report.comments++;
      if (status !== "RELEVANT") report.filtered++;
    }
  } else if (data.comments.length > 0) {
    warn("харьцуулалттай (демо) төсөл алга — санал, бүлгийг алгаслаа");
  }

  // 5. Демо бүртгэлүүд. Clerk-ийн id-г мэдэхгүй тул "seed:<имэйл>" гэж үүсгэнэ;
  //    тэр имэйлээр анх нэвтрэхэд lib/auth.ts энэ мөрийг өөрийнх болгоно.
  for (const email of opts.staffEmails ?? []) {
    await upsertSeedUser(email, "STAFF");
    report.staff.push(email);
  }

  if (opts.demoCitizenEmail) {
    const citizen = await upsertSeedUser(opts.demoCitizenEmail, "CITIZEN");
    report.demoCitizen = opts.demoCitizenEmail;

    // Демод "Тусгасан" гэж тэмдэглэх бүлэг
    const target = data.groups.find((g) => g.demoReflectable && seededGroups.has(g.key));
    if (!opts.demoCitizenComment) {
      warn("DEMO_CITIZEN_COMMENT хоосон — демо иргэний санал үүсээгүй (бодит санал бичнэ үү)");
    } else if (!demoBill || !target) {
      warn("demoReflectable бүлэг алга — демо иргэний санал үүсээгүй");
    } else {
      const fields = {
        clauseId: clauseId(demoBill.key, target.clauseNumber),
        userId: citizen.id,
        body: opts.demoCitizenComment,
        filterStatus: "RELEVANT" as const,
        filterReason: null,
        clusterId: groupId(target.key),
      };
      await prisma.comment.upsert({ where: { id: DEMO_COMMENT_ID }, create: { id: DEMO_COMMENT_ID, ...fields }, update: fields });
      await awardRelevantComment(citizen.id, DEMO_COMMENT_ID); // +2, нэг л удаа
    }
  }

  return report;
}

// Имэйлээр хэрэглэгчийг олно, байхгүй бол "seed:" түр id-тай үүсгэнэ
async function upsertSeedUser(email: string, role: "CITIZEN" | "STAFF") {
  const normalized = email.trim().toLowerCase();
  const existing = await prisma.user.findFirst({ where: { email: { equals: normalized, mode: "insensitive" } } });
  if (existing) {
    return role === "STAFF" && existing.role !== "STAFF"
      ? prisma.user.update({ where: { id: existing.id }, data: { role: "STAFF" } })
      : existing;
  }
  return prisma.user.create({ data: { clerkId: `seed:${normalized}`, email: normalized, role } });
}
