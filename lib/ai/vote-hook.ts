// lib/ai/vote-hook.ts
// "УИХ юу шийдэх вэ? Таамагла!" картын асуултыг бичнэ.
// Тоглогч "Тийм / Үгүй" гэж таамаглана. Асуулт төвийг сахисан, ≤ 70 тэмдэгт, УИХ-ын гишүүний нэргүй.
// Шалгалтад тэнцэхгүй бол null буцаана (Dev 3 энэ үед энгийн асуулт харуулна).

import { askGeminiJSON } from "./client";
import { getText, findMissingNumbers } from "./check";

const MAX_LENGTH = 70;

export async function makeVoteHook(title: string, summaryText: string): Promise<string | null> {
  // 1. STUB горим: AI дуудахгүй, шууд хуурамч асуулт
  if (process.env.AI_STUB === "true") {
    return "Долоо хоногт 12 цаг илүү ажиллуулахыг УИХ дэмжих үү?";
  }

  // 2. Төслийн нэр хоосон бол асуулт бичих зүйл алга
  if (title.trim() === "") {
    return null;
  }

  // 3. AI-аас асуух. AI эсвэл сүлжээний алдаа гарвал унахгүй, null үлдэнэ.
  let result;
  try {
    result = await askGeminiJSON(makePrompt(title, summaryText), 0.5);
  } catch (error) {
    console.log("makeVoteHook: AI алдаа →", String(error).slice(0, 200));
    return null;
  }

  // 4. AI {"question": "..."} хэлбэрээр буцаах ёстой. Өөр хэлбэртэй бол null.
  if (!result || typeof result !== "object") {
    console.log("makeVoteHook: AI буруу хэлбэртэй хариу өгсөн:", result);
    return null;
  }

  // 5. Асуултыг шалгана
  const question = getText(result.question);
  const problem = findVoteHookProblem(question, `${title}\n${summaryText}`);
  if (problem !== "") {
    console.log("makeVoteHook: асуултыг хаялаа →", problem);
    return null;
  }
  return question;
}

// ── Асуултыг шалгана ──
// Асуудалгүй бол "" буцаана, асуудалтай бол юу буруу болохыг.
// scripts/test-vote-hook.ts үүнийг AI-гүйгээр шууд туршдаг.
export function findVoteHookProblem(question: string, sourceText: string): string {
  // 1. Хоосон биш, 70 тэмдэгтээс богино, "?"-ээр төгссөн
  if (question === "") {
    return "асуулт хоосон";
  }
  if (question.length > MAX_LENGTH) {
    return `${question.length} тэмдэгт (${MAX_LENGTH}-аас урт)`;
  }
  if (!question.endsWith("?")) {
    return 'асуулт "?"-ээр төгсөөгүй';
  }

  // 2. Хүний нэр ("Д.Батболд", "Д. Батболд" гэх мэт овгийн үсэг + нэр) орсон эсэх
  if (/[А-ЯЁӨҮ]\.\s?[А-ЯЁӨҮ][а-яёөү]+/.test(question)) {
    return "хүний нэр орсон";
  }

  // 3. Тоо бүр төслийн нэр эсвэл товч агуулгад байх ёстой
  const missing = findMissingNumbers(question, sourceText);
  if (missing.length > 0) {
    return `эх текстэд байхгүй тоо: ${missing.join(", ")}`;
  }
  return "";
}

// ── AI-д өгөх заавар ──
function makePrompt(title: string, summaryText: string): string {
  let summaryPart = summaryText;
  if (summaryText.trim() === "") {
    summaryPart = "(товч агуулга байхгүй)";
  }

  return `Чи 16-18 насны залууст зориулсан "УИХ юу шийдэх вэ? Таамагла!" тоглоомын асуулт бичдэг туслах.
Тоглогч асуултыг уншаад "Тийм" эсвэл "Үгүй" гэж таамаглана.

ТӨСЛИЙН НЭР: ${title}

ТОВЧ АГУУЛГА:
"""
${summaryPart}
"""

ДҮРЭМ:
- Нэг асуулт, ${MAX_LENGTH}-аас ихгүй тэмдэгт, "?"-ээр төгсөнө.
- "Тийм / Үгүй" гэж хариулж болох асуулт. Энгийн хэлбэр: "Энэ төслийг УИХ дэмжих үү?"
- Боломжтой бол төслийн хамгийн сонирхолтой нэг өөрчлөлтийг асуултад дурд.
- Хэлэлцүүлгийн аль шатанд байгааг бид мэдэхгүй тул "анхны", "эцсийн" хэлэлцүүлэг гэж бүү бич.
- Төвийг сахи: хуулийг сайн, муу гэж бүү үнэл, аль нэг хариулт руу бүү чиглүүл.
- УИХ-ын гишүүн, улс төрч, намын нэр бүү дурд.
- Дээрх текстэд байхгүй тоо бүү бич. Тоог цифрээр бич.
- Энгийн, цэвэр монгол хэл.

ЗӨВХӨН ИЙМ JSON БУЦАА:
{"question": "..."}`;
}
