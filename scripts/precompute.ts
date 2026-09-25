// scripts/precompute.ts
// Вэбсайтын бүх AI агуулгыг НЭГ удаа бэлдэж data/precomputed.json-д хадгална. Dev 1-ийн seed.ts үүнийг уншина.
// Демогийн үеэр AI огт дуудагдахгүй.
//
//   1. Демо төсөл (data/law.txt, bill.txt, reason.txt) → заалт бүрийн харьцуулалт + CHANGE картууд
//   2. lawforum.parliament.mn-ийн өсвөр үеийнхэнд хамаатай төслүүд → BILL картууд
//   3. Карт бүрт 3 асуулттай сорил
//   4. Санал хураалтын таамаг (lib/parliament.ts бэлэн бол)
//   5. data/comments.json → шүүх → бүлэглэх → хариуны ноорог
//   6. data/precomputed.json + data/review.md (гараар хянах хүснэгт)
//
// Ажиллуулах: AI_CALL_DELAY_MS=1500 npx tsx --env-file=.env scripts/precompute.ts
//   --max-bills=10    lawforum-аас хамгийн ихдээ хэдэн төсөл авах
//   --no-lawforum     lawforum-ыг алгасах
//   --out=хавтас      өөр хавтас руу бичих (AI_STUB=true үед заавал)

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildClauses, type BuiltClause } from "../lib/law/pipeline";
import { getAllProjects, getProject, type ProjectListItem } from "../lib/lawforum";
import { makeCard, type Card, type CardInput } from "../lib/ai/card";
import { makeQuiz, makeQuizText, type QuizQuestion } from "../lib/ai/quiz";
import { filterComments, groupComments } from "../lib/ai/comments";
import { writeReply } from "../lib/ai/reply";
import { makeVoteHook } from "../lib/ai/vote-hook";
import { modelsUsed } from "../lib/ai/client";
import {
  optionsToText,
  validatePrecomputed,
  type Precomputed,
  type PrecomputedBill,
  type PrecomputedCard,
  type PrecomputedClause,
  type PrecomputedComment,
  type PrecomputedGroup,
  type PrecomputedQuiz,
} from "../lib/ai/precomputed";

// ── Тохиргоо ──
const args = process.argv.slice(2);
const OUT_DIR = getArg("out") || "data";
const MAX_BILLS = Number(getArg("max-bills") || 10);
const USE_LAWFORUM = !args.includes("--no-lawforum");
const MAX_CHANGE_CARDS = 8;
const MIN_DESCRIPTION_LENGTH = 400; // үүнээс богино тайлбартай төслөөс үнэн зөв карт гарахгүй
const MAX_DESCRIPTION_LENGTH = 5000; // AI-д хэт урт текст илгээхгүй
const QUIZ_TRIES = 2;
const DELAY_MS = Number(process.env.AI_CALL_DELAY_MS || 0);

// Өсвөр үеийнхэнд хамаатай сэдвийн түлхүүр үгс (төслийн нэрээр хайна)
const TEEN_TOPICS = [
  "боловсрол", "сургууль", "сурагч", "оюутан", "хүүхэд", "залуу", "өсвөр",
  "интернэт", "цахим", "мэдээлэл", "харилцаа холбоо", "утас",
  "зам", "тээвэр", "жолооч", "авто",
  "татвар", "хөдөлмөр", "ажил",
  "байгаль", "агаар", "орчин", "усны",
  "эрүүл мэнд", "эмнэлэг", "эмийн", "спорт", "гэр бүл",
];

function getArg(name: string): string {
  const found = args.find((a) => a.startsWith(`--${name}=`));
  return found ? found.split("=")[1] : "";
}

// AI-ийн минутын лимитэд хүрэхгүйн тулд дуудлага бүрийн өмнө бага зэрэг хүлээнэ
function pause() {
  return new Promise((resolve) => setTimeout(resolve, DELAY_MS));
}

function readData(name: string): string {
  return readFileSync(join("data", name), "utf8").trim();
}

// ════════════════════════════════════════════════
// Карт + сорил хамт
// ════════════════════════════════════════════════

// Карт хийгээд, 3 асуулттай сорил гаргана. Аль нэг нь бүтэхгүй бол null (картыг хаяна).
async function makeCardWithQuiz(input: CardInput): Promise<{ card: Card; quiz: QuizQuestion[] } | null> {
  await pause();
  const card = await makeCard(input);
  if (card === null) {
    console.log(`   ✗ карт гарсангүй`);
    return null;
  }

  // Сорил 3-аас цөөн асуулттай гарвал 1 удаа дахин оролдоно
  const quizText = makeQuizText(input, card);
  for (let attempt = 1; attempt <= QUIZ_TRIES; attempt++) {
    await pause();
    const quiz = await makeQuiz(quizText);
    if (quiz.length === 3) {
      console.log(`   ✓ ${card.emoji} ${card.hook}`);
      return { card, quiz };
    }
    console.log(`   сорил ${quiz.length}/3 асуулттай гарлаа (${attempt}-р оролдлого)`);
  }
  console.log(`   ✗ сорил бүтэн гарсангүй, картыг хаялаа`);
  return null;
}

// AI-ийн Card + QuizQuestion[]-ийг precomputed.json-ийн картын хэлбэрт оруулна
function toPrecomputedCard(
  key: string,
  input: CardInput,
  projectKey: string,
  sourceUrl: string,
  result: { card: Card; quiz: QuizQuestion[] },
  clauseNumber?: string
): PrecomputedCard {
  const quiz: PrecomputedQuiz[] = result.quiz.map((q) => ({
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
    keyPhrase: q.keyPhrase,
  }));
  return {
    key,
    kind: input.kind,
    projectKey,
    clauseNumber,
    emoji: result.card.emoji,
    hook: result.card.hook,
    before: input.before ?? null,
    after: input.after ?? null,
    youMeaning: result.card.youMeaning,
    personas: result.card.personas,
    sourceUrl,
    order: 0, // дараа нь orderCards тавина
    sourceQuote: result.card.sourceQuote,
    quiz,
  };
}

// ════════════════════════════════════════════════
// 1. Демо төсөл
// ════════════════════════════════════════════════

async function buildDemoBill(): Promise<{ bill: PrecomputedBill; built: BuiltClause[]; cards: PrecomputedCard[] }> {
  console.log("\n══ 1. Демо төсөл (data/)");
  const title = readData("title.txt");
  const reasonText = readData("reason.txt");
  // Демо төслийн lawforum хаяг (байвал) data/source.txt-д
  const sourceUrl = existsSync("data/source.txt") ? readData("source.txt") : "";

  // a. Dev 1-ийн харьцуулалт: readAmendment → applyChanges → compareWords → explainChange
  const built = await buildClauses({
    currentLawText: readData("law.txt"),
    amendmentText: readData("bill.txt"),
    reasonText,
  });

  // b. Зөвхөн өөрчлөгдсөн, асуудалгүй хэрэглэгдсэн заалтууд
  const comparison: PrecomputedClause[] = [];
  for (const clause of built) {
    if (clause.changeType === "UNCHANGED") {
      continue;
    }
    if (clause.applyError) {
      console.log(`   ⚠ ${clause.number}: өөрчлөлтийг хэрэглэж чадсангүй, алгаслаа`);
      continue;
    }
    comparison.push({
      number: clause.number,
      oldText: clause.oldText,
      newText: clause.newText,
      changeType: clause.changeType,
      sourceQuote: clause.sourceQuote,
      what: clause.what,
      why: clause.why,
      who: clause.who,
    });
  }
  console.log(`   ${comparison.length} заалт өөрчлөгдсөн`);

  // c. Ойлгомжтой өөрчлөлтүүд (хүчингүй болгосноос илүү өөрчилсөн, нэмсэн нь) түрүүнд
  const sorted = [...comparison].sort((a, b) => typeScore(b) - typeScore(a));
  const cards: PrecomputedCard[] = [];
  for (const clause of sorted.slice(0, MAX_CHANGE_CARDS)) {
    console.log(`── ${clause.number} (${clause.changeType})`);
    const input: CardInput = {
      kind: "CHANGE",
      title,
      before: clause.oldText,
      after: clause.newText,
      reasonText,
    };
    const result = await makeCardWithQuiz(input);
    if (result !== null) {
      cards.push(toPrecomputedCard(`demo-${clause.number}`, input, "demo", sourceUrl, result, clause.number));
    }
  }

  const bill: PrecomputedBill = { key: "demo", title, summary: reasonText, sourceUrl, comparison };
  return { bill, built, cards };
}

function typeScore(clause: PrecomputedClause): number {
  if (clause.changeType === "CHANGED") return 2;
  if (clause.changeType === "ADDED") return 2;
  return 1; // REMOVED — ихэвчлэн шилжилтийн заалт, өсвөр үеийнхэнд бага сонирхолтой
}

// ════════════════════════════════════════════════
// 2. lawforum.parliament.mn-ийн төслүүд
// ════════════════════════════════════════════════

async function buildLawforumBills(): Promise<{ bills: PrecomputedBill[]; cards: PrecomputedCard[] }> {
  console.log("\n══ 2. lawforum.parliament.mn");
  const bills: PrecomputedBill[] = [];
  const cards: PrecomputedCard[] = [];
  if (!USE_LAWFORUM) {
    console.log("   --no-lawforum: алгаслаа");
    return { bills, cards };
  }

  // a. Бүх төслийн жагсаалт
  let projects: ProjectListItem[] = [];
  try {
    projects = await getAllProjects();
  } catch (error) {
    console.log("   ✗ lawforum-тай холбогдож чадсангүй, алгаслаа:", String(error).slice(0, 200));
    return { bills, cards };
  }

  // b. Сэдвийн оноогоор эрэмбэлнэ (оноо ижил бол шинэ нь түрүүнд)
  const candidates = projects
    .map((project) => ({ project, score: topicScore(project.title || "") }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || (b.project.publishedOnUtc || "").localeCompare(a.project.publishedOnUtc || ""));
  console.log(`   ${projects.length} төслөөс ${candidates.length} нь сэдэвт тохирч байна`);

  // c. Нэг нэгээр нь дэлгэрэнгүйг авч карт хийнэ
  for (const { project } of candidates) {
    if (cards.length >= MAX_BILLS) {
      break;
    }
    const detail = await getProject(project.id);
    const title = (detail.title || "").trim();
    const description = stripHtml(detail.description || "");
    console.log(`── lf-${project.id}: ${title.slice(0, 70)}`);
    if (description.length < MIN_DESCRIPTION_LENGTH) {
      console.log(`   алгаслаа: тайлбар ${description.length} тэмдэгт (хэт богино)`);
      continue;
    }

    const key = `lf-${project.id}`;
    const sourceUrl = lawforumPageUrl(project.id, detail.slugUrl);
    const summary = description.slice(0, MAX_DESCRIPTION_LENGTH);
    const input: CardInput = { kind: "BILL", title, summaryText: summary };
    const result = await makeCardWithQuiz(input);
    if (result === null) {
      continue;
    }
    bills.push({ key, lawforumId: project.id, title, summary, sourceUrl });
    cards.push(toPrecomputedCard(key, input, key, sourceUrl, result));
  }
  return { bills, cards };
}

// Төслийн нэрэнд сэдвийн хэдэн түлхүүр үг байгааг тоолно
function topicScore(title: string): number {
  const lower = title.toLowerCase();
  let score = 0;
  for (const topic of TEEN_TOPICS) {
    if (lower.includes(topic)) {
      score++;
    }
  }
  return score;
}

// lawforum-ын хуудасны хаяг. slugUrl бүтэн хаяг бол түүнийг, үгүй бол id-аар.
// ⚠ id-аар хийсэн хаягийн хэлбэрийг хөтөч дээр шалгаарай (review.md-д тэмдэглэсэн).
function lawforumPageUrl(id: number, slugUrl: string | null): string {
  if (slugUrl && slugUrl.startsWith("http")) {
    return slugUrl;
  }
  return `https://lawforum.parliament.mn/project/${id}`;
}

// HTML-ийг цэвэр текст болгоно
function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// ════════════════════════════════════════════════
// 3. Картын дараалал
// ════════════════════════════════════════════════

// Эхний 3 карт = сурагчдад хамгийн хамаатай. Дараа нь бүх иргэнд хамаатай, дараа нь бусад.
// Эцсийн дарааллыг review.md-ийн "order" мөрөөр гараар засна.
function orderCards(cards: PrecomputedCard[]): PrecomputedCard[] {
  const score = (card: PrecomputedCard) => {
    let points = 0;
    if (card.personas.includes("STUDENT")) points += 3;
    if (card.personas.includes("ALL")) points += 2;
    if (card.hook.endsWith("?")) points += 1; // асуулт хэлбэрийн hook илүү сонирхол татдаг
    return points;
  };
  const sorted = [...cards].sort((a, b) => score(b) - score(a));
  return sorted.map((card, index) => ({ ...card, order: index + 1 }));
}

// ════════════════════════════════════════════════
// 4. Санал хураалтын таамаг
// ════════════════════════════════════════════════

async function buildVoteEvents() {
  console.log("\n══ 4. Санал хураалтын таамаг (ParliamentAPI)");
  // Dev 1-ийн lib/parliament.ts-д getAgendaList, getAgendaVoteList хэрэгтэй.
  // Файл одоогоор хоосон тул TypeScript import хийхгүй — замыг хувьсагчаар өгнө
  const parliamentPath = "../lib/parliament";
  const parliament = (await import(parliamentPath)) as Record<string, unknown>;
  if (typeof parliament.getAgendaList !== "function" || typeof parliament.getAgendaVoteList !== "function") {
    console.log("   ✗ lib/parliament.ts-д getAgendaList / getAgendaVoteList алга → алгаслаа");
    return [];
  }
  // Функцууд бэлэн болмогц тэдний буцаах хэлбэрийг харж энд гүйцээнэ (Dev 2).
  // makeVoteHook(title, summary) → hook, isReplay: true.
  console.log("   ⚠ lib/parliament.ts бэлэн болсон — энэ алхмыг гүйцээх хэрэгтэй (Dev 2)");
  void makeVoteHook;
  return [];
}

// ════════════════════════════════════════════════
// 5. Демо санал: шүүх → бүлэглэх → хариуны ноорог
// ════════════════════════════════════════════════

type RawComment = { clause: string; name: string; vote: string; text: string };

async function buildComments(built: BuiltClause[]): Promise<{ comments: PrecomputedComment[]; groups: PrecomputedGroup[] }> {
  console.log("\n══ 5. Демо санал (data/comments.json)");
  const raw: RawComment[] = JSON.parse(readData("comments.json"));
  const comments: PrecomputedComment[] = [];
  const groups: PrecomputedGroup[] = [];

  // a. Санал бүрт түлхүүр өгнө: c1, c2, ...
  const withKeys = raw.map((c, index) => ({ ...c, key: `c${index + 1}` }));

  // b. Заалт бүрээр
  const clauseNumbers = [...new Set(withKeys.map((c) => c.clause))];
  for (const number of clauseNumbers) {
    const clause = built.find((c) => c.number === number);
    const clauseText = clause ? clause.newText || clause.oldText || "" : "";
    const clauseComments = withKeys.filter((c) => c.clause === number);
    console.log(`── ${number}: ${clauseComments.length} санал`);
    if (clauseText === "") {
      console.log("   ⚠ ийм заалт харьцуулалтад алга, алгаслаа");
      continue;
    }

    // Шүүх (юу ч устгахгүй, зөвхөн шошго)
    await pause();
    const labels = await filterComments(
      clauseText,
      clauseComments.map((c) => ({ id: c.key, text: c.text }))
    );
    for (const c of clauseComments) {
      const label = labels.find((l) => l.id === c.key);
      comments.push({
        key: c.key,
        clauseNumber: number,
        name: c.name,
        vote: c.vote,
        text: c.text,
        filterStatus: label ? label.status : "RELEVANT",
        filterReason: label ? label.reason : "",
      });
    }

    // Бүлэглэх (зөвхөн RELEVANT)
    const relevant = clauseComments.filter((c) => {
      const label = labels.find((l) => l.id === c.key);
      return !label || label.status === "RELEVANT";
    });
    console.log(`   ${relevant.length} хамааралтай, ${clauseComments.length - relevant.length} шүүгдсэн`);
    if (relevant.length === 0) {
      continue;
    }
    await pause();
    const clauseGroups = await groupComments(
      clauseText,
      relevant.map((c) => ({ id: c.key, text: c.text }))
    );

    // Бүлэг бүрт хариуны ноорог
    for (const group of clauseGroups) {
      const examples = relevant.filter((c) => group.commentIds.includes(c.key)).map((c) => c.text);
      await pause();
      const replyDraft = await writeReply(clauseText, {
        title: group.title,
        summary: group.summary,
        examples: examples.slice(0, 3),
      });
      groups.push({
        key: `g${groups.length + 1}`,
        clauseNumber: number,
        title: group.title,
        summary: group.summary,
        commentKeys: group.commentIds,
        replyDraft,
        demoReflectable: false,
      });
      console.log(`   ✓ "${group.title}" (${group.commentIds.length} санал)`);
    }
  }

  // c. Хамгийн олон саналтай бүлгийг демод "Тусгасан" гэж тэмдэглэхэд санал болгоно
  //    (review.md дээр өөр бүлэг сонгож болно)
  let biggest: PrecomputedGroup | null = null;
  for (const group of groups) {
    if (group.replyDraft !== "" && (biggest === null || group.commentKeys.length > biggest.commentKeys.length)) {
      biggest = group;
    }
  }
  if (biggest !== null) {
    biggest.demoReflectable = true;
  }
  return { comments, groups };
}

// ════════════════════════════════════════════════
// 6. review.md — гараар хянах хүснэгт
// ════════════════════════════════════════════════

// Хүснэгтийн нүдэнд "|" болон мөр шилжилт орвол хүснэгт эвдэрнэ
function cell(text: string | null | undefined): string {
  return (text || "").replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ");
}

function makeReview(data: Precomputed): string {
  const lines: string[] = [];
  lines.push("# Агуулгын хяналт");
  lines.push("");
  lines.push("Карт бүрийг эх сурвалжтай нь тулгаж шалгана уу.");
  lines.push("- **Зөв үү?** баганад ✅ эсвэл ❌ тавина.");
  lines.push("- **Засвар** баганад шинэ текст бичвэл `npx tsx scripts/apply-review.ts` түүнийг precomputed.json-д оруулна. Хоосон бол өөрчлөхгүй.");
  lines.push("- `options` мөрийн засвар: хариултуудыг ` ‖ `-ээр тусгаарлаж, зөвийг нь урд нь ✔ тавина. Жишээ: `8 цаг ‖ ✔12 цаг ‖ 40 цаг`");
  lines.push("- `personas` засвар: `STUDENT, WORKER` гэх мэт (STUDENT, DRIVER, WORKER, PARENT, ALL).");
  lines.push("- `delete` мөрийн засварт `тийм` гэж бичвэл карт устна. `order` = дараалал (1 = хамгийн түрүүнд).");
  lines.push("- ⚠ lawforum-ын хаягийг (`sourceUrl`) нэг удаа хөтөч дээр нээж шалгана уу.");
  lines.push("");
  lines.push(`Үүсгэсэн: ${data.generatedAt} · Загвар: ${data.model}`);
  lines.push("");

  const sortedCards = [...data.cards].sort((a, b) => a.order - b.order);
  for (const card of sortedCards) {
    const bill = data.bills.find((b) => b.key === card.projectKey);
    const source = card.before || card.after ? `Хуучин: ${card.before || "(байхгүй)"} → Шинэ: ${card.after || "(байхгүй)"}` : bill?.summary.slice(0, 300) + "…";
    lines.push(`## ${card.key} · ${card.emoji} ${cell(card.hook)}`);
    lines.push("");
    lines.push(`Төсөл: ${bill?.title || card.projectKey} · ${card.sourceUrl || "(хаяг алга)"}`);
    lines.push("");
    lines.push(`Эх текст: ${cell(source)}`);
    lines.push("");
    lines.push("| Талбар | Одоогийн | Эх сурвалжийн ишлэл | Зөв үү? (✅/❌) | Засвар |");
    lines.push("|---|---|---|---|---|");
    lines.push(`| order | ${card.order} |  |  |  |`);
    lines.push(`| emoji | ${card.emoji} |  |  |  |`);
    lines.push(`| hook | ${cell(card.hook)} (${card.hook.length}) | ${cell(card.sourceQuote)} |  |  |`);
    lines.push(`| youMeaning | ${cell(card.youMeaning)} | ${cell(card.sourceQuote)} |  |  |`);
    lines.push(`| personas | ${card.personas.join(", ")} |  |  |  |`);
    card.quiz.forEach((q, i) => {
      const n = i + 1;
      lines.push(`| q${n}.question | ${cell(q.question)} |  |  |  |`);
      lines.push(`| q${n}.options | ${cell(optionsToText(q.options, q.correctIndex))} | ${cell(q.keyPhrase)} |  |  |`);
      lines.push(`| q${n}.explanation | ${cell(q.explanation)} |  |  |  |`);
    });
    lines.push(`| delete | үгүй |  |  |  |`);
    lines.push("");
  }

  // Демо санал, бүлгүүд
  lines.push("## Демо санал: бүлэг ба хариуны ноорог");
  lines.push("");
  lines.push("`demo` мөрөнд `тийм` гэж бичвэл тэр бүлгийг демод \"Тусгасан\" гэж тэмдэглэхэд ашиглана (зөвхөн нэг).");
  lines.push("");
  for (const group of data.groups) {
    const texts = data.comments.filter((c) => group.commentKeys.includes(c.key)).map((c) => c.text);
    lines.push(`### ${group.key} · ${group.clauseNumber} · ${cell(group.title)}`);
    lines.push("");
    lines.push(`Саналууд (${texts.length}): ${cell(texts.map((t) => `«${t}»`).join(" "))}`);
    lines.push("");
    lines.push("| Талбар | Одоогийн | Зөв үү? (✅/❌) | Засвар |");
    lines.push("|---|---|---|---|");
    lines.push(`| title | ${cell(group.title)} |  |  |`);
    lines.push(`| replyDraft | ${cell(group.replyDraft)} |  |  |`);
    lines.push(`| demo | ${group.demoReflectable ? "тийм" : "үгүй"} |  |  |`);
    lines.push("");
  }

  // Шүүгдсэн саналууд (мэдээлэл)
  const filtered = data.comments.filter((c) => c.filterStatus !== "RELEVANT");
  lines.push(`## Шүүгдсэн саналууд (${filtered.length}) — устгаагүй, ажилтан сэргээж болно`);
  lines.push("");
  lines.push("| Санал | Заалт | Шошго | Шалтгаан | Текст |");
  lines.push("|---|---|---|---|---|");
  for (const c of filtered) {
    lines.push(`| ${c.key} | ${c.clauseNumber} | ${c.filterStatus} | ${cell(c.filterReason)} | ${cell(c.text)} |`);
  }
  lines.push("");
  return lines.join("\n");
}

// ════════════════════════════════════════════════
// Гол дараалал
// ════════════════════════════════════════════════

async function main() {
  // Хуурамч өгөгдлийг data/-д санамсаргүй бичихгүй (Dev 1 seed хийвэл шүүгчид харна)
  if (process.env.AI_STUB === "true" && OUT_DIR === "data") {
    console.log("AI_STUB=true үед data/ руу бичихгүй. --out=өөр/хавтас гэж өгнө үү.");
    process.exit(1);
  }

  const demo = await buildDemoBill();
  const lawforum = await buildLawforumBills();
  const voteEvents = await buildVoteEvents();
  const { comments, groups } = await buildComments(demo.built);

  let model = modelsUsed.join(", ");
  if (process.env.AI_STUB === "true") {
    model = "AI_STUB (хуурамч)";
  }

  const data: Precomputed = {
    generatedAt: new Date().toISOString(),
    model,
    bills: [demo.bill, ...lawforum.bills],
    cards: orderCards([...demo.cards, ...lawforum.cards]),
    voteEvents,
    comments,
    groups,
  };

  // Бичих
  writeFileSync(join(OUT_DIR, "precomputed.json"), JSON.stringify(data, null, 2) + "\n");
  writeFileSync(join(OUT_DIR, "review.md"), makeReview(data));
  if (voteEvents.length > 0) {
    writeFileSync(join(OUT_DIR, "vote-events.json"), JSON.stringify(voteEvents, null, 2) + "\n");
  }

  // Шалгах
  console.log("\n══ Дүн");
  console.log(`   ${data.bills.length} төсөл, ${data.cards.length} карт, ${data.voteEvents.length} таамаг, ${comments.length} санал, ${groups.length} бүлэг`);
  console.log(`   Загвар: ${model || "(AI дуудагдаагүй)"}`);
  if (data.cards.length < 12 || data.cards.length > 18) {
    console.log(`   ⚠ ${data.cards.length} карт (зорилго 12–18)`);
  }
  const problems = validatePrecomputed(data);
  for (const problem of problems) {
    console.log(`   ✗ ${problem}`);
  }
  console.log(`   → ${join(OUT_DIR, "precomputed.json")}, ${join(OUT_DIR, "review.md")}`);
  if (problems.length > 0) {
    process.exit(1);
  }
}

main();
