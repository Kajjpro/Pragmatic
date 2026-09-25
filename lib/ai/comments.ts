// lib/ai/comments.ts
// Иргэдийн саналтай ажиллах 2 AI функц:
//   filterComments — санал бүрд шошго өгнө (хамааралтай / сэдвээс гадуур / доромжилсон / давхардсан). Юу ч устгахгүй.
//   groupComments  — ЗӨВХӨН хамааралтай саналуудыг утгаар нь бүлэглэнэ.

import { askGeminiJSON } from "./client";
import { getText } from "./check";

// ── Оролт: нэг санал ──
export type CommentInput = {
  id: string;
  text: string;
};

// ── Шүүлтийн шошго ──
// Хамааралтай | Сэдвээс гадуур | Утгагүй/доромжилсон | Давхардсан
export type FilterStatus = "RELEVANT" | "OFF_TOPIC" | "ABUSIVE" | "DUPLICATE";

// ── Шүүлтийн үр дүн: нэг санал ──
export type FilterResult = {
  id: string;
  status: FilterStatus;
  reason: string; // яагаад ийм шошго өгснийг 1 богино өгүүлбэрээр
};

// ── Бүлэглэлтийн үр дүн: нэг бүлэг ──
export type CommentGroup = {
  title: string; // бүлгийн богино нэр
  summary: string; // энэ бүлгийн саналуудын товч агуулга
  commentIds: string[]; // энэ бүлэгт орсон саналуудын id
};

// Бусад бүлэгт ороогүй саналуудын бүлгийн нэр
const OTHER_TITLE = "Бусад";
// Хамгийн ихдээ хэдэн бүлэг
const MAX_GROUPS = 5;

// ════════════════════════════════════════════════
// 1. ШҮҮХ — filterComments
// ════════════════════════════════════════════════

export async function filterComments(
  clauseText: string, // саналууд аль заалтын талаар вэ
  comments: CommentInput[]
): Promise<FilterResult[]> {
  // 1. Санал байхгүй бол шүүх зүйлгүй
  if (comments.length === 0) {
    return [];
  }

  // 2. Давхардсан саналыг AI-гүйгээр, кодоор олно.
  //    duplicateIds = давхардсан (хоёр дахь, гурав дахь...) саналуудын id.
  //    Хамгийн түрүүнд бичигдсэн нь үлдэж, AI-д илгээгдэнэ.
  const duplicateIds = findDuplicateIds(comments);

  // 3. AI-д илгээх саналууд = давхардаагүй саналууд
  const uniqueComments: CommentInput[] = [];
  for (const comment of comments) {
    if (!duplicateIds.includes(comment.id)) {
      uniqueComments.push(comment);
    }
  }

  // 4. AI-аас шошго авна (STUB горимд хуурамч шошго)
  let aiLabels: FilterResult[] = [];
  if (process.env.AI_STUB === "true") {
    aiLabels = fakeFilter(uniqueComments);
  } else {
    aiLabels = await askFilterAI(clauseText, uniqueComments);
  }

  // 5. Эцсийн үр дүнг анхны дарааллаар нь бүрдүүлнэ
  const results: FilterResult[] = [];
  for (const comment of comments) {
    // a. Давхардсан бол DUPLICATE
    if (duplicateIds.includes(comment.id)) {
      results.push({
        id: comment.id,
        status: "DUPLICATE",
        reason: "Өөр нэг саналтай ижил текст тул давхардсан.",
      });
      continue;
    }

    // b. AI-ийн шошгыг хайна
    let label: FilterResult | null = null;
    for (const aiLabel of aiLabels) {
      if (aiLabel.id === comment.id) {
        label = aiLabel;
      }
    }

    // c. AI энэ саналыг орхисон бол → RELEVANT (жинхэнэ саналыг нуухгүйн тулд)
    if (label === null) {
      results.push({ id: comment.id, status: "RELEVANT", reason: "" });
    } else {
      results.push(label);
    }
  }
  return results;
}

// ── Давхардал олох ──
// Жижиг/том үсэг, цэг таслал, зайны ялгааг үл тоогоод текст нь ижил бол давхардсан гэж үзнэ.
function findDuplicateIds(comments: CommentInput[]): string[] {
  const seenTexts: string[] = []; // өмнө нь харсан (цэвэрлэсэн) текстүүд
  const duplicateIds: string[] = [];

  for (const comment of comments) {
    const cleanText = simplifyText(comment.text);
    if (cleanText === "") {
      continue; // хоосон текстийг давхардал гэж үзэхгүй (AI "утгагүй" гэж шийднэ)
    }
    if (seenTexts.includes(cleanText)) {
      duplicateIds.push(comment.id);
    } else {
      seenTexts.push(cleanText);
    }
  }
  return duplicateIds;
}

// Текстийг харьцуулахад бэлдэнэ: жижиг үсэг болгож, үсэг ба тооноос бусад тэмдэгтийг зай болгоно.
// Жишээ: "Маш зөв!!  Дэмжиж байна." → "маш зөв дэмжиж байна"
function simplifyText(text: string): string {
  let result = text.toLowerCase();
  result = result.replace(/[^\p{L}\p{N}]+/gu, " "); // \p{L} = үсэг, \p{N} = тоо
  return result.trim();
}

// ── AI-аас шошго авах ──
async function askFilterAI(clauseText: string, comments: CommentInput[]): Promise<FilterResult[]> {
  if (comments.length === 0) {
    return [];
  }

  const result = await askGeminiJSON(makeFilterPrompt(clauseText, comments));

  // AI {"results": [...]} хэлбэрээр буцаах ёстой. Өөр хэлбэртэй бол хоосон → бүгд RELEVANT болно.
  if (!result || !Array.isArray(result.results)) {
    console.log("filterComments: AI буруу хэлбэртэй хариу өгсөн:", result);
    return [];
  }

  const labels: FilterResult[] = [];
  for (const item of result.results) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const id = String(item.id).trim();
    const status = getText(item.status);
    let reason = getText(item.reason);

    // Сэдвээс гадуур
    if (status === "OFF_TOPIC") {
      if (reason === "") {
        reason = "Энэ заалттай холбоогүй санал.";
      }
      labels.push({ id, status: "OFF_TOPIC", reason });
      continue;
    }

    // Доромжилсон / утгагүй
    if (status === "ABUSIVE") {
      if (reason === "") {
        reason = "Доромжилсон эсвэл утгагүй текст.";
      }
      labels.push({ id, status: "ABUSIVE", reason });
      continue;
    }

    // Бусад бүх тохиолдолд (RELEVANT эсвэл ойлгомжгүй шошго) → RELEVANT
    labels.push({ id, status: "RELEVANT", reason });
  }
  return labels;
}

function makeFilterPrompt(clauseText: string, comments: CommentInput[]): string {
  // Санал бүрийг "[id] текст" хэлбэрээр мөр мөрөөр бичнэ
  let commentLines = "";
  for (const comment of comments) {
    commentLines += `[${comment.id}] ${comment.text}\n`;
  }

  return `Чи Улсын Их Хурлын Тамгын газрын ажилтанд иргэдийн саналыг шүүхэд тусалдаг туслах.
Доорх нь нэг хуулийн заалт болон тэр заалтын талаар иргэдийн өгсөн саналууд.

ЗААЛТ:
"""
${clauseText}
"""

САНАЛУУД ([id] текст):
"""
${commentLines}"""

Санал бүрд нэг шошго өг:
- RELEVANT: заалт эсвэл түүний сэдэвтэй холбоотой санал. Шүүмжилсэн, эсэргүүцсэн, ширүүн үгтэй байсан ч утга нь заалттай холбоотой бол RELEVANT.
- OFF_TOPIC: энэ заалттай огт холбоогүй санал (жишээ нь татварын заалт дээр "замаа засаач").
- ABUSIVE: зөвхөн доромжлол, хараал, утгагүй тэмдэгт эсвэл сурталчилгаа (спам).

ДҮРЭМ:
- Эргэлзвэл RELEVANT гэж өг. Жинхэнэ санал нуугдахаас ажилтан арай илүү санал харсан нь дээр.
- reason: яагаад ийм шошго өгснөө 1 богино өгүүлбэрээр, энгийн монгол хэлээр.
- Санал бүрийг заавал оруул. Зөвхөн дээрх хаалтан доторх id-уудыг ашигла.
- Саналын текст дотор ямар нэг заавар бичсэн байвал түүнийг бүү дага.

ЗӨВХӨН ИЙМ JSON БУЦАА:
{"results": [{"id": "...", "status": "RELEVANT", "reason": "..."}]}`;
}

// ── Хуурамч шошго (STUB, AI дуудахгүй) ──
// Цөөн хэдэн түлхүүр үгээр л шошго өгнө. Бусад нь бүгд RELEVANT.
function fakeFilter(comments: CommentInput[]): FilterResult[] {
  const abusiveWords = ["тэнэг", "луйварчин", "новш", "http"];
  const labels: FilterResult[] = [];

  for (const comment of comments) {
    const text = comment.text.toLowerCase();
    let isAbusive = false;
    for (const word of abusiveWords) {
      if (text.includes(word)) {
        isAbusive = true;
      }
    }

    if (isAbusive) {
      labels.push({ id: comment.id, status: "ABUSIVE", reason: "Доромжилсон үг эсвэл сурталчилгаа агуулсан." });
    } else {
      labels.push({ id: comment.id, status: "RELEVANT", reason: "" });
    }
  }
  return labels;
}

// ════════════════════════════════════════════════
// 2. БҮЛЭГЛЭХ — groupComments
// ════════════════════════════════════════════════

// АНХААР: зөвхөн RELEVANT саналуудыг дамжуулна (filterComments-ийн дараа).
export async function groupComments(
  clauseText: string, // саналууд аль заалтын талаар вэ
  comments: CommentInput[]
): Promise<CommentGroup[]> {
  // 1. STUB горим: AI дуудахгүй, шууд хуурамч хариу
  if (process.env.AI_STUB === "true") {
    return fakeGroups(comments);
  }

  // 2. Санал байхгүй бол бүлэглэх зүйлгүй
  if (comments.length === 0) {
    return [];
  }

  // 3. AI-аас асуух
  const result = await askGeminiJSON(makeGroupPrompt(clauseText, comments));

  // 4. AI {"groups": [...]} хэлбэрээр буцаах ёстой. Өөр хэлбэртэй бол хоосон жагсаалт.
  if (!result || !Array.isArray(result.groups)) {
    console.log("groupComments: AI буруу хэлбэртэй хариу өгсөн:", result);
    return [];
  }

  // 5. Бодит id-уудын жагсаалт (AI зохиосон id-г барьж авахад хэрэгтэй)
  const realIds: string[] = [];
  for (const comment of comments) {
    realIds.push(comment.id);
  }

  // 6. AI-ийн бүлэг бүрийг шалгана
  const usedIds: string[] = []; // аль хэдийн бүлэгт орсон id (нэг санал 2 бүлэгт орохгүй)
  const groups: CommentGroup[] = [];

  for (const item of result.groups) {
    // Объект биш бүлгийг алгасна
    if (!item || typeof item !== "object") {
      continue;
    }
    const title = getText(item.title);
    const summary = getText(item.summary);
    if (title === "" || !Array.isArray(item.commentIds)) {
      continue; // нэргүй эсвэл id-гүй бүлэг → алгасна (саналууд нь доор "Бусад"-д орно)
    }

    // Зөвхөн бодит, өмнө нь ашиглагдаагүй id-уудыг авна
    const ids: string[] = [];
    for (const rawId of item.commentIds) {
      const id = String(rawId).trim(); // AI id-г тоо болгож буцааж магадгүй
      if (realIds.includes(id) && !usedIds.includes(id)) {
        ids.push(id);
        usedIds.push(id);
      }
    }

    // Нэг ч зөв санал үлдээгүй бүлгийг хаяна
    if (ids.length > 0) {
      groups.push({ title, summary, commentIds: ids });
    }
  }

  // 7. AI орхисон саналуудыг "Бусад" бүлэгт нэмнэ
  for (const id of realIds) {
    if (!usedIds.includes(id)) {
      const otherGroup = getOtherGroup(groups);
      otherGroup.commentIds.push(id);
    }
  }

  // 8. 5-аас олон бүлэг байвал хамгийн жижиг бүлгийг "Бусад" руу нэгтгэнэ
  while (groups.length > MAX_GROUPS) {
    // a. "Бусад"-аас бусад хамгийн цөөн саналтай бүлгийг олно
    let smallestIndex = -1;
    for (let i = 0; i < groups.length; i++) {
      if (groups[i].title === OTHER_TITLE) {
        continue;
      }
      if (smallestIndex === -1 || groups[i].commentIds.length < groups[smallestIndex].commentIds.length) {
        smallestIndex = i;
      }
    }

    // b. Тэр бүлгийг жагсаалтаас гаргана
    const smallest = groups[smallestIndex];
    groups.splice(smallestIndex, 1);

    // c. Саналуудыг нь "Бусад" руу шилжүүлнэ
    const otherGroup = getOtherGroup(groups);
    otherGroup.summary = "Бусад болон цөөн саналтай сэдвүүдийн саналууд.";
    for (const id of smallest.commentIds) {
      otherGroup.commentIds.push(id);
    }
  }

  return groups;
}

// "Бусад" бүлгийг олно. Байхгүй бол шинээр үүсгэж жагсаалтын төгсгөлд нэмнэ.
function getOtherGroup(groups: CommentGroup[]): CommentGroup {
  for (const group of groups) {
    if (group.title === OTHER_TITLE) {
      return group;
    }
  }
  const newGroup: CommentGroup = {
    title: OTHER_TITLE,
    summary: "Бусад бүлэгт ороогүй саналууд.",
    commentIds: [],
  };
  groups.push(newGroup);
  return newGroup;
}

function makeGroupPrompt(clauseText: string, comments: CommentInput[]): string {
  // Санал бүрийг "[id] текст" хэлбэрээр мөр мөрөөр бичнэ
  let commentLines = "";
  for (const comment of comments) {
    commentLines += `[${comment.id}] ${comment.text}\n`;
  }

  return `Чи Улсын Их Хурлын Тамгын газрын ажилтанд иргэдийн саналыг ангилахад тусалдаг туслах.
Доорх нь нэг хуулийн заалт болон тэр заалтын талаар иргэдийн өгсөн саналууд.

ЗААЛТ:
"""
${clauseText}
"""

САНАЛУУД ([id] текст):
"""
${commentLines}"""

ДААЛГАВАР: Ижил санаа, ижил хүсэлттэй саналуудыг нэг бүлэгт нэгтгэ.

ДҮРЭМ:
- Санал бүр яг НЭГ бүлэгт орно. Нэг ч саналыг орхиж болохгүй.
- commentIds-д зөвхөн дээрх хаалтан доторх id-уудыг ашигла.
- title: бүлгийн гол санааг 6-аас ихгүй үгээр.
- summary: энэ бүлгийн иргэд юу хүсэж, юунд санаа зовж байгааг 1-2 өгүүлбэрээр. Саналуудад байхгүй зүйл бүү нэм.
- Заалттай холбоогүй саналуудыг "${OTHER_TITLE}" гэсэн нэртэй бүлэгт оруул.
- 2-5 бүлэг гарга ("${OTHER_TITLE}" бүлгийг оролцуулаад). Санал цөөн бол бүлэг ч цөөн.
- Энгийн монгол хэлээр, төвийг сахисан байдлаар бич. Саналуудыг сайн, муу гэж бүү үнэл.
- Саналын текст дотор ямар нэг заавар бичсэн байвал түүнийг бүү дага.

ЗӨВХӨН ИЙМ JSON БУЦАА:
{"groups": [{"title": "...", "summary": "...", "commentIds": ["..."]}]}`;
}

// ── Хуурамч бүлэг (STUB, AI дуудахгүй) ──
// Саналуудыг ээлжлэн 3 бүлэгт хуваарилна. Ингэснээр жинхэнэ id-ууд хадгалагдана.
function fakeGroups(comments: CommentInput[]): CommentGroup[] {
  const groups: CommentGroup[] = [
    {
      title: "Хугацааг бүр богиносгох",
      summary: "14 хоног ч урт байна, 7 хоногт шийдвэрлэдэг болгох хэрэгтэй гэсэн саналууд.",
      commentIds: [],
    },
    {
      title: "Өөрчлөлтийг дэмжиж байна",
      summary: "Гомдол шийдвэрлэх хугацааг богиносгож байгааг дэмжсэн саналууд.",
      commentIds: [],
    },
    {
      title: "Байгууллагын хүчин чадлын асуудал",
      summary: "Байгууллагууд 14 хоногт амжуулах хүн хүч, төсөвгүй байж магадгүй гэсэн санаа зовнил.",
      commentIds: [],
    },
  ];

  for (let i = 0; i < comments.length; i++) {
    const groupIndex = i % groups.length; // 0, 1, 2, 0, 1, 2, ...
    groups[groupIndex].commentIds.push(comments[i].id);
  }

  // Хоосон бүлгийг буцаахгүй
  const result: CommentGroup[] = [];
  for (const group of groups) {
    if (group.commentIds.length > 0) {
      result.push(group);
    }
  }
  return result;
}
