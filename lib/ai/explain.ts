// lib/ai/explain.ts
// Нэг заалтын өөрчлөлтийг иргэнд ойлгомжтой энгийн хэлээр тайлбарлана: юу / яагаад / хэнд.

import { askGeminiJSON } from "./client";
import { getText, isInText } from "./check";

// ── Гаралт ──
export type Explanation = {
  what: string; // юу өөрчлөгдөж байна
  why: string; // яагаад (ЗӨВХӨН төслийн үндэслэлээс)
  who: string; // хэнд нөлөөлөх вэ
};

// Шалтгаан олдохгүй үед хэрэглэх өгүүлбэр
const NO_REASON = "Шалтгааныг төсөлд дурдаагүй.";

export async function explainChange(
  oldTextInput: string | null, // хуучин заалт (ADD үед null эсвэл хоосон)
  newTextInput: string | null, // шинэ заалт (REMOVE үед null эсвэл хоосон)
  reasonText: string // төслийн үндэслэл, танилцуулга (байхгүй бол хоосон)
): Promise<Explanation> {
  // 1. STUB горим: Gemini дуудахгүй, шууд хуурамч хариу
  if (process.env.AI_STUB === "true") {
    return fakeExplanation();
  }

  // 2. null ирвэл хоосон текст болгоно
  const oldText = oldTextInput || "";
  const newText = newTextInput || "";

  // 3. Хуучин, шинэ хоёулаа хоосон бол тайлбарлах зүйл алга
  if (oldText.trim() === "" && newText.trim() === "") {
    return { what: "", why: NO_REASON, who: "" };
  }

  // 4. AI-аас асуух
  const result = await askGeminiJSON(makePrompt(oldText, newText, reasonText));

  // 5. AI объект буцаах ёстой. Үгүй бол хоосон тайлбар.
  if (!result || typeof result !== "object") {
    console.log("explainChange: AI буруу хэлбэртэй хариу өгсөн:", result);
    return { what: "", why: NO_REASON, who: "" };
  }

  const what = getText(result.what);
  const who = getText(result.who);

  // 6. "Яагаад" хэсгийг шалгана:
  //    AI үндэслэлээс авсан өгүүлбэрээ (whyQuote) үг үсгээр нь өгөх ёстой.
  //    Тэр өгүүлбэр reasonText дотор үнэхээр байвал л AI-ийн "why"-г хүлээн авна.
  //    Үгүй бол AI өөрөө зохиосон байж магадгүй тул NO_REASON болгоно.
  const aiWhy = getText(result.why);
  const whyQuote = getText(result.whyQuote);
  let why = NO_REASON;
  if (aiWhy !== "" && isInText(whyQuote, reasonText)) {
    why = aiWhy;
  }

  return { what, why, who };
}

// ── AI-д өгөх заавар ──
function makePrompt(oldText: string, newText: string, reasonText: string): string {
  // Хоосон талбарт юу гэж харуулахыг тодорхой бичнэ
  let oldPart = oldText;
  if (oldText.trim() === "") {
    oldPart = "(хуучин заалт байхгүй — шинээр нэмэгдэж байна)";
  }
  let newPart = newText;
  if (newText.trim() === "") {
    newPart = "(шинэ заалт байхгүй — хүчингүй болж байна)";
  }
  let reasonPart = reasonText;
  if (reasonText.trim() === "") {
    reasonPart = "(үндэслэл байхгүй)";
  }

  return `Чи хуулийн өөрчлөлтийг энгийн иргэнд ойлгомжтой тайлбарладаг туслах.

ХУУЧИН ЗААЛТ:
"""
${oldPart}
"""

ШИНЭ ЗААЛТ:
"""
${newPart}
"""

ТӨСЛИЙН ҮНДЭСЛЭЛ:
"""
${reasonPart}
"""

Дараах 4 талбарыг бөглө:
- what: Юу өөрчлөгдөж байгааг 1-2 өгүүлбэрээр. Хуучин ба шинэ заалтын ялгааг тодорхой хэл.
- who: Энэ өөрчлөлт хэнд хамаарахыг 1 өгүүлбэрээр. Зөвхөн заалтын текстэд үндэслэ.
- why: Яагаад өөрчилж байгааг 1-2 өгүүлбэрээр. ЗӨВХӨН "ТӨСЛИЙН ҮНДЭСЛЭЛ"-д бичсэн зүйлээс ав. Өөрөөсөө шалтгаан бүү зохио. Үндэслэлд ЭНЭ өөрчлөлтийн шалтгаан байхгүй бол why = "".
- whyQuote: why-г батлах өгүүлбэрийг "ТӨСЛИЙН ҮНДЭСЛЭЛ"-ээс ЯГ ХУУЛЖ бич, нэг ч үсэг өөрчлөхгүй. why хоосон бол whyQuote = "".

ХЭЛ, ӨНГӨ АЯС:
- Ахлах ангийн сурагч ойлгохуйц энгийн монгол хэлээр бич. Хуулийн нэр томьёог энгийн үгээр тайлбарла.
- Төвийг сахисан байх. Өөрчлөлтийг сайн, муу гэж бүү үнэл. Улс төрийн санал бодол бүү оруул.

ЗӨВХӨН ИЙМ JSON БУЦАА:
{"what": "...", "who": "...", "why": "...", "whyQuote": "..."}`;
}

// ── Хуурамч өгөгдөл (Gemini дуудахгүй) ──
function fakeExplanation(): Explanation {
  return {
    what: "Агаарын бохирдлын талаарх иргэний гомдлыг шийдвэрлэх хугацаа 30 хоногоос 14 хоног болж богиносно.",
    why: "Төслийн үндэслэлд дурдсанаар гомдлыг 30 хоногт шийдвэрлэх нь хэт урт байсан тул хугацааг богиносгох шаардлагатай гэжээ.",
    who: "Агаарын бохирдлын талаар гомдол гаргадаг иргэд, гомдлыг шийдвэрлэдэг төрийн байгууллагууд.",
  };
}
