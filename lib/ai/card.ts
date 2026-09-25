// lib/ai/card.ts
// Хуулийн төсөл эсвэл нэг заалтын өөрчлөлтийг 60 секундын "хуулийн карт" болгоно.
// Карт = emoji + hook (гүйлгэхээ зогсоох 1 мөр) + youMeaning ("чамд юу гэсэн үг вэ") + personas (хэнд хамаатай).
//
// Худал карт гаргахгүйн тулд:
//   - hook, youMeaning дахь тоо бүр оролтын текстэд байх ёстой
//   - AI картаа батлах ишлэлээ (quote) оролтын текстээс яг хуулж өгөх ёстой
// Шалгалтад тэнцэхгүй бол 1 удаа илүү хатуу заавраар дахин асууна. Дахиад тэнцэхгүй бол null (картгүй).

import { askGeminiJSON } from "./client";
import { getText, isInText, findMissingNumbers, countSentences } from "./check";

// ── Оролт ──
export type CardKind = "BILL" | "CHANGE"; // бүтэн төсөл | нэг заалтын өөрчлөлт

export type CardInput = {
  kind: CardKind;
  title: string; // төслийн нэр
  before?: string | null; // CHANGE: хуучин заалт (шинээр нэмэгдэж байвал хоосон)
  after?: string | null; // CHANGE: шинэ заалт (хүчингүй болж байвал хоосон)
  summaryText?: string | null; // BILL: төслийн товч агуулга
  reasonText?: string | null; // төслийн үндэслэл (заавал биш)
};

// ── Гаралт ──
// Сурагч, оюутан | Жолооч | Ажил хийдэг хүн | Эцэг эх | Бүх иргэн
export type Persona = "STUDENT" | "DRIVER" | "WORKER" | "PARENT" | "ALL";

export type Card = {
  emoji: string; // сэдэвт тохирох 1 emoji
  hook: string; // ≤ 60 тэмдэгт, сонирхол татах үнэн баримт эсвэл асуулт
  youMeaning: string; // ≤ 2 өгүүлбэр, "чи"-гээр хандсан, өдөр тутмын жишээтэй
  personas: Persona[]; // хэнд хамаатай
};

const PERSONAS: Persona[] = ["STUDENT", "DRIVER", "WORKER", "PARENT", "ALL"];
const MAX_HOOK_LENGTH = 60;
const MAX_SENTENCES = 2;
const DEFAULT_EMOJI = "📜";

export async function makeCard(input: CardInput): Promise<Card | null> {
  // 1. STUB горим: AI дуудахгүй, шууд хуурамч карт
  if (process.env.AI_STUB === "true") {
    return fakeCard(input);
  }

  // 2. AI эсвэл сүлжээний алдаа гарвал унахгүй, картгүй (null) үлдэнэ
  try {
    return await makeCardWithAI(input);
  } catch (error) {
    console.log("makeCard: AI алдаа, картгүй үлдлээ →", String(error).slice(0, 200));
    return null;
  }
}

async function makeCardWithAI(input: CardInput): Promise<Card | null> {
  // 1. Нэрээс өөр текст байхгүй бол карт хийх баримт алга
  const sourceText = getSourceText(input);
  if (sourceText.trim() === input.title.trim()) {
    return null;
  }

  // 2. 1-р оролдлого (temperature 0.6 = илүү сонирхолтой үг сонголт)
  const firstAnswer = await askGeminiJSON(makePrompt(input, ""), 0.6);
  const first = checkCard(firstAnswer, sourceText);
  if (first.card !== null) {
    return first.card;
  }
  console.log("makeCard: 1-р оролдлого тэнцсэнгүй →", first.problem);

  // 3. 2-р оролдлого: юу буруу байсныг хэлж, илүү хатуу заавар өгнө (temperature 0.2 = болгоомжтой)
  const secondAnswer = await askGeminiJSON(makePrompt(input, first.problem), 0.2);
  const second = checkCard(secondAnswer, sourceText);
  if (second.card !== null) {
    return second.card;
  }
  console.log("makeCard: 2-р оролдлого ч тэнцсэнгүй, картыг хаялаа →", second.problem);
  return null;
}

// ── AI-ийн хариуг шалгаж, Card болгоно ──
// Тэнцвэл { card, problem: "" }, тэнцэхгүй бол { card: null, problem: "юу буруу" }.
// scripts/test-card.ts үүнийг AI-гүйгээр шууд туршдаг.
export function checkCard(answer: unknown, sourceText: string): { card: Card | null; problem: string } {
  // 1. Объект биш бол буруу хэлбэр
  if (!answer || typeof answer !== "object" || Array.isArray(answer)) {
    return { card: null, problem: "JSON объект биш" };
  }
  const result = answer as Record<string, unknown>;

  // 2. hook: хоосон биш, 60 тэмдэгтээс богино
  const hook = getText(result.hook);
  if (hook === "") {
    return { card: null, problem: "hook хоосон" };
  }
  if (hook.length > MAX_HOOK_LENGTH) {
    return { card: null, problem: `hook ${hook.length} тэмдэгт (${MAX_HOOK_LENGTH}-аас урт)` };
  }

  // 3. youMeaning: хоосон биш, ихдээ 2 өгүүлбэр, "чи"-гээр хандсан
  const youMeaning = getText(result.youMeaning);
  if (youMeaning === "") {
    return { card: null, problem: "youMeaning хоосон" };
  }
  const sentenceCount = countSentences(youMeaning);
  if (sentenceCount > MAX_SENTENCES) {
    return { card: null, problem: `youMeaning ${sentenceCount} өгүүлбэр (ихдээ ${MAX_SENTENCES})` };
  }
  if (!speaksToYou(youMeaning)) {
    return { card: null, problem: 'youMeaning "чи"-гээр хандаагүй' };
  }

  // 4. Ишлэл (quote) оролтын текстэд үг үсгээрээ байх ёстой
  const quote = getText(result.quote);
  if (!isInText(quote, sourceText)) {
    return { card: null, problem: "quote оролтын текстэд үг үсгээрээ алга" };
  }

  // 5. hook, youMeaning дахь тоо бүр оролтын текстэд байх ёстой
  const missing = findMissingNumbers(hook + " " + youMeaning, sourceText);
  if (missing.length > 0) {
    return { card: null, problem: `оролтын текстэд байхгүй тоо: ${missing.join(", ")}` };
  }

  // 6. personas: зөвшөөрөгдсөн нэрсээс ядаж нэг
  const personas = readPersonas(result.personas);
  if (personas.length === 0) {
    return { card: null, problem: "personas хоосон эсвэл буруу нэртэй" };
  }

  // 7. emoji буруу бол анхдагч emoji тавина (үүнээс болж картыг хаяхгүй)
  const emoji = readEmoji(result.emoji);

  return { card: { emoji, hook, youMeaning, personas }, problem: "" };
}

// ── Туслах функцууд ──

// Шалгалтад хэрэглэх оролтын бүх текст (нэр + хуучин + шинэ + товч агуулга + үндэслэл)
function getSourceText(input: CardInput): string {
  const parts = [input.title, input.before, input.after, input.summaryText, input.reasonText];
  let text = "";
  for (const part of parts) {
    if (part && part.trim() !== "") {
      text += part.trim() + "\n";
    }
  }
  return text.trim();
}

// Текст "чи"-гээр хандсан эсэх: чи, чинь, чиний..., чам... (чамд, чамайг, чамаас)
function speaksToYou(text: string): boolean {
  const words = text.toLowerCase().split(/[^\p{L}]+/u); // үсэг биш бүх тэмдэгтээр үг болгон хуваана
  for (const word of words) {
    if (word === "чи" || word === "чинь" || word.startsWith("чиний") || word.startsWith("чам")) {
      return true;
    }
  }
  return false;
}

// AI-ийн personas жагсаалтаас зөвшөөрөгдсөн нэрсийг л үлдээнэ. ALL байвал зөвхөн ["ALL"].
function readPersonas(value: unknown): Persona[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const personas: Persona[] = [];
  for (const item of value) {
    const name = getText(item).toUpperCase();
    for (const persona of PERSONAS) {
      if (persona === name && !personas.includes(persona)) {
        personas.push(persona);
      }
    }
  }
  if (personas.includes("ALL")) {
    return ["ALL"];
  }
  return personas;
}

// Emoji хоосон, хэт урт, эсвэл үсэг/тоо агуулсан бол анхдагч emoji
function readEmoji(value: unknown): string {
  const emoji = getText(value);
  if (emoji === "" || emoji.length > 8 || /[\p{L}\p{N}]/u.test(emoji)) {
    return DEFAULT_EMOJI;
  }
  return emoji;
}

// ── AI-д өгөх заавар ──
// problem хоосон биш бол (2-р оролдлого) өмнөх алдааг нь хэлж, илүү хатуу дүрэм нэмнэ.
function makePrompt(input: CardInput, problem: string): string {
  // 1. Оролтын хэсгүүд (хоосон талбарыг алгасна)
  let sourcePart = `ТӨСЛИЙН НЭР: ${input.title}\n`;
  if (input.kind === "CHANGE") {
    sourcePart += `\nХУУЧИН ЗААЛТ:\n"""\n${input.before || "(байхгүй — шинээр нэмэгдэж байна)"}\n"""\n`;
    sourcePart += `\nШИНЭ ЗААЛТ:\n"""\n${input.after || "(байхгүй — хүчингүй болж байна)"}\n"""\n`;
  }
  if (input.summaryText) {
    sourcePart += `\nТӨСЛИЙН ТОВЧ АГУУЛГА:\n"""\n${input.summaryText}\n"""\n`;
  }
  if (input.reasonText) {
    sourcePart += `\nТӨСЛИЙН ҮНДЭСЛЭЛ:\n"""\n${input.reasonText}\n"""\n`;
  }

  // 2. Юуны тухай карт бичих вэ
  let task = "Дээрх хуулийн төслийг бүхэлд нь нэг картад бич. Хамгийн олон хүнд хамаатай гол өөрчлөлтийг сонго.";
  if (input.kind === "CHANGE") {
    task = "Дээрх НЭГ заалтын өөрчлөлтийг (хуучин → шинэ) картад бич. Юу өөрчлөгдөж байгаад гол анхаар.";
  }

  // 3. 2-р оролдлогын нэмэлт хатуу дүрэм
  let strictPart = "";
  if (problem !== "") {
    strictPart = `
АНХААР: Өмнөх хариу чинь шалгалтад тэнцээгүй. Шалтгаан: ${problem}.
Энэ удаад:
- hook ${MAX_HOOK_LENGTH} тэмдэгтээс богино байх.
- youMeaning ихдээ ${MAX_SENTENCES} өгүүлбэр, "чи"-гээр хандсан байх.
- Дээрх текстэд байхгүй ганц ч тоо бүү бич. Эргэлзвэл тоогүйгээр бич.
- quote-ийг дээрх текстээс үсэг үсгээр нь хуулж тавь.
`;
  }

  return `Чи 16-18 насны монгол залууст хуулийг 60 секундэд ойлгуулдаг "хуулийн карт" бичдэг туслах.
Карт утсан дээр гарна. Уншигч гүйлгэж яваад зогсох эсэхээ 2 секундэд шийднэ.

${sourcePart}
${task}

ТАЛБАРУУД:
- emoji: сэдэвт тохирох ГАНЦ emoji.
- hook: ${MAX_HOOK_LENGTH}-аас ихгүй тэмдэгт. 16 настай хүн гүйлгэхээ зогсоож унших сонирхолтой баримт эсвэл асуулт. Зөвхөн дээрх текстэд байгаа үнэн зүйл. Хэтрүүлсэн, худал, айлгасан гарчиг бүү бич.
- youMeaning: 1-2 богино өгүүлбэр. "Чи"-гээр ханд (чи, чамд, чиний). Өдөр тутмын бодит жишээ ашигла (сургууль, ажил, гэр бүл, зам гэх мэт). Хуулийн нэр томьёог энгийн үгээр хэл.
- personas: энэ текст ҮНЭХЭЭР хамаарах бүлгүүд. Сонголт: STUDENT (сурагч, оюутан), DRIVER (жолооч), WORKER (ажил хийдэг хүн), PARENT (эцэг эх), ALL (бүх иргэн). Бүх иргэнд хамаатай бол зөвхөн ["ALL"]. Шууд хамаагүй бүлгийг бүү нэм.
- quote: hook болон youMeaning-ийн гол баримтыг батлах хэсгийг дээрх текстээс ЯГ ХУУЛЖ бич. Нэг ч үсэг өөрчлөхгүй, 3-20 үг.

ТОО, БАРИМТ:
- hook, youMeaning-д гарах тоо бүр дээрх текстэд яг байх ёстой. Шинэ тоо, хувь, огноо, мөнгөн дүн бүү зохио.
- Тоог өөр нэгжид бүү хөрвүүл ("12 сар"-ыг "1 жил" гэж бүү бич). Тоог цифрээр бич.
- Жишээндээ ч шинэ тоо бүү оруул. Текстэд байхгүй баримт, шалтгаан бүү нэм.

ХЭЛ, ӨНГӨ АЯС:
- Энгийн, цэвэр монгол хэл. Зохиомол "залуучуудын хэллэг", англи үг бүү холь.
- Төвийг сахи: хуулийг сайн, муу гэж бүү үнэл. Улс төрч, намын нэр бүү дурд.
${strictPart}
ЗӨВХӨН ИЙМ JSON БУЦАА:
{"emoji": "...", "hook": "...", "youMeaning": "...", "personas": ["..."], "quote": "..."}`;
}

// ── Хуурамч өгөгдөл (AI дуудахгүй) ──
// Демо хууль (Хөдөлмөрийн тухай хуулийн төсөл)-ийн сэдвээр, түлхүүр үгээр нь тохирох картыг сонгоно.
function fakeCard(input: CardInput): Card {
  const text = `${input.before || ""} ${input.after || ""}`;

  if (input.kind === "CHANGE" && text.includes("илүү цаг")) {
    return {
      emoji: "⏰",
      hook: "Долоо хоногт 12 цаг илүү ажиллаж болох уу?",
      youMeaning:
        "Чи ажил хийдэг бол ажил олгогч чамайг зөвхөн бичгээр зөвшөөрсөн үед л долоо хоногт 12 цаг хүртэл илүү ажиллуулж болно. Гэхдээ сард нийлээд 40 цагаас хэтрэхгүй.",
      personas: ["WORKER"],
    };
  }
  if (input.kind === "CHANGE" && text.includes("чөлөө")) {
    return {
      emoji: "👶",
      hook: "Ээж, аав хоёр 12 сарын чөлөөг хувааж авч болно",
      youMeaning:
        "Чиний гэр бүлд хүүхэд төрвөл ээж, аав чинь 12 сарын чөлөөг хоорондоо тохиролцож хуваах эрхтэй болно. Жишээ нь эхлээд ээж нь, дараа нь аав нь гэртээ байж болно.",
      personas: ["PARENT", "WORKER"],
    };
  }
  if (input.kind === "CHANGE" && text.includes("Интернэт")) {
    return {
      emoji: "💻",
      hook: "Гэрээсээ ажиллавал интернэтийн мөнгийг хэн төлөх вэ?",
      youMeaning: "Чи гэрээсээ зайнаас ажилладаг бол интернэтийн наад захын зардлыг ажил олгогч чинь хариуцна.",
      personas: ["WORKER"],
    };
  }
  if (input.kind === "CHANGE" && text.includes("онлайн")) {
    return {
      emoji: "🌐",
      hook: "Ажлын маргаанаа онлайнаар эвлэрүүлж болох уу?",
      youMeaning:
        "Чи хөдөө ажилладаг бөгөөд ажил олгогчтойгоо маргалдвал хот руу явалгүй онлайн платформ ашиглан эвлэрэх боломжтой болно.",
      personas: ["WORKER"],
    };
  }
  if (input.kind === "CHANGE" && text.includes("хариуцлагатай")) {
    return {
      emoji: "⚖️",
      hook: "“Байна” → “байж болно”: ганц үг, өөр утга",
      youMeaning:
        "Одоо ажил олгогч чиний ажлын аюулгүй байдлыг хангах “хариуцлагатай байна” гэж заасан бол төсөлд “байж болно” гэж өөрчилж байна.",
      personas: ["WORKER"],
    };
  }

  if (input.kind === "CHANGE") {
    return {
      emoji: "📜",
      hook: "Энэ заалтыг өөрчлөх санал гарлаа",
      youMeaning: "Чи хуучин, шинэ текстийг харьцуулаад өөрт чинь хамаатай эсэхийг шалгаарай.",
      personas: ["ALL"],
    };
  }

  // BILL: бүтэн төслийн карт (демо хууль бол түүний сэдвээр)
  if (!input.title.includes("Хөдөлмөр")) {
    return {
      emoji: "📜",
      hook: "УИХ энэ хуулийг өөрчлөхөөр хэлэлцэж байна",
      youMeaning: "Чи өөрт чинь хамаатай заалт байгаа эсэхийг доорх картуудаас хараарай.",
      personas: ["ALL"],
    };
  }
  return {
    emoji: "💼",
    hook: "Илүү цаг, эцэг эхийн чөлөө, интернэт: юу өөрчлөгдөх вэ?",
    youMeaning:
      "Чи цагийн ажил хийдэг ч, ирээдүйд ажилд орох ч энэ төсөл чиний ажлын цаг, илүү цаг, чөлөөний эрхэд хамаатай.",
    personas: ["WORKER", "PARENT"],
  };
}
