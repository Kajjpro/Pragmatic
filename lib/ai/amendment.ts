// lib/ai/amendment.ts
// Хуульд нэмэлт, өөрчлөлт оруулах төслийг уншаад, заалт бүрийн өөрчлөлтийг жагсаалт болгоно.

import { askGeminiJSON } from "./client";
import { getText, isInText } from "./check";

// ── Нэг өөрчлөлтийн хэлбэр ──
export type Change = {
  action: "ADD" | "REMOVE" | "REPLACE_WORDS" | "REWRITE"; // нэмэх / хүчингүй болгох / үг солих / өөрчлөн найруулах
  clause: string; // заалтын дугаар, жишээ нь "3.1"
  oldWords?: string; // REPLACE_WORDS үед: солигдох хуучин үг
  newText?: string; // шинэ үг (REPLACE_WORDS) эсвэл заалтын шинэ бүтэн текст (ADD / REWRITE)
  sourceQuote: string; // төслөөс үг үсгээр нь авсан өгүүлбэр
};

export async function readAmendment(billText: string): Promise<Change[]> {
  // 1. STUB горим: Gemini дуудахгүй, шууд хуурамч хариу
  if (process.env.AI_STUB === "true") {
    return fakeChanges();
  }

  // 2. Төсөл хоосон бол AI дуудах шаардлагагүй
  if (billText.trim() === "") {
    return [];
  }

  // 3. AI-аас асуух
  const result = await askGeminiJSON(makePrompt(billText));

  // 4. AI {"changes": [...]} хэлбэрээр буцаах ёстой. Өөр хэлбэртэй бол хоосон жагсаалт.
  if (!result || !Array.isArray(result.changes)) {
    console.log("readAmendment: AI буруу хэлбэртэй хариу өгсөн:", result);
    return [];
  }

  // 5. Мөр бүрийг шалгаж, зөвхөн зөвийг нь үлдээнэ
  const goodChanges: Change[] = [];
  for (const item of result.changes) {
    // Объект биш мөрийг алгасна
    if (!item || typeof item !== "object") {
      continue;
    }
    const change = checkOneChange(item, billText);
    if (change !== null) {
      goodChanges.push(change);
    }
  }
  return goodChanges;
}

// ── AI-д өгөх заавар ──
function makePrompt(billText: string): string {
  return `Чи Улсын Их Хурлын Тамгын газрын хууль боловсруулах зөвлөхийн туслах.
Доорх нь "хуульд нэмэлт, өөрчлөлт оруулах тухай" хуулийн төсөл. Төслийг уншаад, хуулийн заалт бүрт хийгдэх өөрчлөлтийг жагсаа.

ӨӨРЧЛӨЛТИЙН 5 ТӨРӨЛ:
1. REPLACE_WORDS — заалтын зарим үгийг солих.
   Жишээ хэллэг: "...гэснийг ...гэж өөрчилсүгэй"
   Мөн үг хасах: "...гэснийг хассугай" → newText = ""
2. REWRITE — заалтыг бүхэлд нь шинээр найруулах.
   Жишээ хэллэг: "...дугаар зүйлийн ... дахь хэсгийг доор дурдсанаар өөрчлөн найруулсугай"
3. ADD — шинэ заалт нэмэх.
   Жишээ хэллэг: "...дараах агуулгатай ... дахь хэсэг нэмсүгэй" (эсвэл "доор дурдсан агуулгатай")
4. REMOVE — заалтыг хүчингүй болгох.
   Жишээ хэллэг: "...хүчингүй болсонд тооцсугай"
5. INSERT_AFTER — үгийн ДАРАА шинэ үг нэмэх.
   Жишээ хэллэг: "..."А" гэсний дараа "Б" гэж нэмсүгэй"
   → oldWords = "А" (нэмэхээс өмнөх үг), newText = "Б" (ЗӨВХӨН нэмэгдэж буй үг, цэг таслалтай нь яг хуулна).

ДҮРЭМ:
- clause: өөрчлөгдөж буй заалтын дугаар, зөвхөн тоо ба цэг. Жишээ: "3.1", "12.2.4". Бүтэн зүйл бол "7".
- Нэг өгүүлбэр хэд хэдэн заалтыг өөрчилж байвал ("тус тус") заалт бүрт тусдаа мөр гарга.
- REPLACE_WORDS: oldWords = хашилт доторх хуучин үг, newText = хашилт доторх шинэ үг. Хашилтыг өөрийг нь бүү оруул.
- ADD, REWRITE: newText = заалтын шинэ бүтэн текст, төслөөс үсэг үсгээр нь хуул. Эхэнд байгаа дугаарыг (жишээ нь "10.4.") болон хашилтыг бүү оруул. oldWords = "".
- REMOVE: oldWords = "", newText = "".
- sourceQuote: өөрчлөлтийг заасан өгүүлбэрийг төслөөс ЯГ ХУУЛЖ бич, нэг ч үсэг өөрчлөхгүй. ADD, REWRITE үед ":" тэмдэг хүртэлх заах өгүүлбэрийг л бич.
- Хууль хэзээнээс хүчин төгөлдөр болох тухай зэрэг заалтыг өөрчлөхгүй өгүүлбэрийг алгас.
- Төсөлд байхгүй зүйл бүү зохио.

ЗӨВХӨН ИЙМ JSON БУЦАА:
{"changes": [{"action": "REPLACE_WORDS", "clause": "3.1", "oldWords": "...", "newText": "...", "sourceQuote": "..."}]}

ХУУЛИЙН ТӨСӨЛ:
"""
${billText}
"""`;
}

// ── AI-ийн нэг мөрийг шалгана. Зөв бол Change, буруу бол null буцаана ──
function checkOneChange(item: Record<string, unknown>, billText: string): Change | null {
  const action = getText(item.action);
  const clause = getText(item.clause);
  const oldWords = getText(item.oldWords);
  const newText = getText(item.newText);
  const sourceQuote = getText(item.sourceQuote);

  // a. Заалтын дугаар заавал байх ёстой
  if (clause === "") {
    return drop("заалтын дугаар алга", item);
  }

  // b. Ишлэл төсөлд үг үсгээр нь байх ёстой. Үгүй бол AI зохиосон гэж үзээд хаяна.
  if (!isInText(sourceQuote, billText)) {
    return drop("sourceQuote төсөлд олдсонгүй", item);
  }

  // c. Үг солих: хуучин үг ба шинэ үг хоёулаа ишлэл дотор байх ёстой
  if (action === "REPLACE_WORDS") {
    if (!isInText(oldWords, sourceQuote)) {
      return drop("oldWords ишлэлд олдсонгүй", item);
    }
    // newText хоосон байж болно (үг хасах үед)
    if (newText !== "" && !isInText(newText, sourceQuote)) {
      return drop("newText ишлэлд олдсонгүй", item);
    }
    return { action, clause, oldWords, newText, sourceQuote };
  }

  // d. Үгийн дараа нэмэх: хоёр үг хоёулаа ишлэлд байх ёстой.
  //    Дараа нь REPLACE_WORDS болгоно: "А" → "А Б". Ингэснээр applyChanges өөрчлөгдөх шаардлагагүй.
  if (action === "INSERT_AFTER") {
    if (!isInText(oldWords, sourceQuote)) {
      return drop("oldWords ишлэлд олдсонгүй", item);
    }
    if (!isInText(newText, sourceQuote)) {
      return drop("нэмэх үг ишлэлд олдсонгүй", item);
    }
    return {
      action: "REPLACE_WORDS",
      clause,
      oldWords,
      newText: joinWords(oldWords, newText),
      sourceQuote,
    };
  }

  // e. Нэмэх / өөрчлөн найруулах: шинэ текст төсөлд байх ёстой
  if (action === "ADD" || action === "REWRITE") {
    if (!isInText(newText, billText)) {
      return drop("newText төсөлд олдсонгүй", item);
    }
    return { action, clause, newText, sourceQuote };
  }

  // f. Хүчингүй болгох: нэмэлт шалгалт хэрэггүй
  if (action === "REMOVE") {
    return { action, clause, sourceQuote };
  }

  // g. Бидний мэдэхгүй action ирвэл хаяна
  return drop("action буруу: " + action, item);
}

// Хуучин үгийн араас шинэ үгийг залгана.
// Шинэ үг цэг таслалаар эхэлбэл зайгүй: "иргэн" + ", хуулийн этгээд" → "иргэн, хуулийн этгээд"
// Бусад үед зайтай: "төрийн байгууллага" + "болон ..." → "төрийн байгууллага болон ..."
function joinWords(anchor: string, inserted: string): string {
  const firstChar = inserted.charAt(0);
  if (firstChar === "," || firstChar === ";" || firstChar === "." || firstChar === ":") {
    return anchor + inserted;
  }
  return anchor + " " + inserted;
}

// Хаясан мөрийг консолд харуулна (яагаад хаяснаа шалгахад хэрэгтэй)
function drop(reason: string, item: unknown): null {
  console.log("readAmendment: хаяв —", reason, item);
  return null;
}

// ── Хуурамч өгөгдөл (Gemini дуудахгүй) ──
// scripts/test-read-amendment.ts доторх жишээ төсөлтэй таарна.
function fakeChanges(): Change[] {
  return [
    {
      action: "ADD",
      clause: "10.4",
      newText:
        "Нийслэлийн Засаг дарга агаарын чанарын хэмжилтийн мэдээллийг цаг тутам олон нийтэд нээлттэй нийтэлнэ.",
      sourceQuote:
        "1 дүгээр зүйл.Агаарын тухай хуулийн 10 дугаар зүйлд доор дурдсан агуулгатай 10.4 дэх хэсэг нэмсүгэй:",
    },
    {
      action: "REPLACE_WORDS",
      clause: "12.2",
      oldWords: "түүхий нүүрс",
      newText: "түүхий нүүрс, шатах тослог материал",
      sourceQuote:
        "2 дугаар зүйл.Агаарын тухай хуулийн 12 дугаар зүйлийн 12.2 дахь хэсгийн “түүхий нүүрс” гэснийг “түүхий нүүрс, шатах тослог материал” гэж, 12.3 дахь хэсгийн “30 хоногийн” гэснийг “14 хоногийн” гэж тус тус өөрчилсүгэй.",
    },
    {
      action: "REPLACE_WORDS",
      clause: "12.3",
      oldWords: "30 хоногийн",
      newText: "14 хоногийн",
      sourceQuote:
        "2 дугаар зүйл.Агаарын тухай хуулийн 12 дугаар зүйлийн 12.2 дахь хэсгийн “түүхий нүүрс” гэснийг “түүхий нүүрс, шатах тослог материал” гэж, 12.3 дахь хэсгийн “30 хоногийн” гэснийг “14 хоногийн” гэж тус тус өөрчилсүгэй.",
    },
    {
      action: "REWRITE",
      clause: "15.1",
      newText:
        "Агаарын бохирдлыг бууруулах үндэсний хорооны бүрэлдэхүүнд иргэний нийгмийн байгууллагын хоёроос доошгүй төлөөлөл оролцоно.",
      sourceQuote:
        "3 дугаар зүйл.Агаарын тухай хуулийн 15 дугаар зүйлийн 15.1 дэх хэсгийг доор дурдсанаар өөрчлөн найруулсугай:",
    },
    {
      action: "REMOVE",
      clause: "18.5",
      sourceQuote:
        "4 дүгээр зүйл.Агаарын тухай хуулийн 18 дугаар зүйлийн 18.5 дахь хэсгийг хүчингүй болсонд тооцсугай.",
    },
    {
      action: "REPLACE_WORDS",
      clause: "3.1",
      oldWords: "хариуцлагатай байна",
      newText: "хариуцлагатай байж болно",
      sourceQuote:
        "5 дугаар зүйл.Агаарын тухай хуулийн 3 дугаар зүйлийн 3.1 дэх хэсгийн “хариуцлагатай байна” гэснийг “хариуцлагатай байж болно” гэж өөрчилсүгэй.",
    },
    {
      action: "REPLACE_WORDS",
      clause: "20.2",
      oldWords: "хүндэтгэн үзэх шалтгаангүйгээр",
      newText: "",
      sourceQuote:
        "6 дугаар зүйл.Агаарын тухай хуулийн 20 дугаар зүйлийн 20.2 дахь хэсгийн “хүндэтгэн үзэх шалтгаангүйгээр” гэснийг хассугай.",
    },
    {
      action: "REPLACE_WORDS", // "гэсний дараа ... гэж нэмсүгэй" → REPLACE_WORDS болгосон
      clause: "21.1",
      oldWords: "иргэн",
      newText: "иргэн, хуулийн этгээд",
      sourceQuote:
        "7 дугаар зүйл.Агаарын тухай хуулийн 21 дүгээр зүйлийн 21.1 дэх хэсгийн “иргэн” гэсний дараа “, хуулийн этгээд” гэж нэмсүгэй.",
    },
    {
      action: "REPLACE_WORDS",
      clause: "22.3",
      oldWords: "төрийн байгууллага",
      newText: "төрийн байгууллага болон орон нутгийн өөрөө удирдах байгууллага",
      sourceQuote:
        "8 дугаар зүйл.Агаарын тухай хуулийн 22 дугаар зүйлийн 22.3 дахь хэсгийн “төрийн байгууллага” гэсний дараа “болон орон нутгийн өөрөө удирдах байгууллага” гэж нэмсүгэй.",
    },
  ];
}
