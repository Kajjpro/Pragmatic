// lib/ai/comments.ts
// Нэг заалт дээр ирсэн иргэдийн саналуудыг утгаар нь ижил бүлэг болгож ангилна.

import { askGeminiJSON } from "./client";
import { getText } from "./check";

// ── Оролт: нэг санал ──
export type CommentInput = {
  id: string;
  text: string;
};

// ── Гаралт: нэг бүлэг ──
export type CommentGroup = {
  title: string; // бүлгийн богино нэр
  summary: string; // энэ бүлгийн саналуудын товч агуулга
  commentIds: string[]; // энэ бүлэгт орсон саналуудын id
};

// Заалттай холбоогүй эсвэл AI орхисон саналуудын бүлгийн нэр
const OTHER_TITLE = "Бусад";

export async function groupComments(
  clauseText: string, // саналууд аль заалтын талаар вэ
  comments: CommentInput[]
): Promise<CommentGroup[]> {
  // 1. STUB горим: Gemini дуудахгүй, шууд хуурамч хариу
  if (process.env.AI_STUB === "true") {
    return fakeGroups(comments);
  }

  // 2. Санал байхгүй бол ангилах зүйлгүй
  if (comments.length === 0) {
    return [];
  }

  // 3. AI-аас асуух
  const result = await askGeminiJSON(makePrompt(clauseText, comments));

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

  // 7. AI орхисон саналуудыг олно
  const leftoverIds: string[] = [];
  for (const id of realIds) {
    if (!usedIds.includes(id)) {
      leftoverIds.push(id);
    }
  }

  // 8. Орхисон санал байвал "Бусад санал" бүлэгт нэмнэ (ийм бүлэг байхгүй бол шинээр үүсгэнэ)
  if (leftoverIds.length > 0) {
    let otherGroup: CommentGroup | null = null;
    for (const group of groups) {
      if (group.title === OTHER_TITLE) {
        otherGroup = group;
      }
    }
    if (otherGroup === null) {
      otherGroup = {
        title: OTHER_TITLE,
        summary: "Бусад бүлэгт ороогүй саналууд.",
        commentIds: [],
      };
      groups.push(otherGroup);
    }
    for (const id of leftoverIds) {
      otherGroup.commentIds.push(id);
    }
  }

  return groups;
}

// ── AI-д өгөх заавар ──
function makePrompt(clauseText: string, comments: CommentInput[]): string {
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

// ── Хуурамч өгөгдөл (Gemini дуудахгүй) ──
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
