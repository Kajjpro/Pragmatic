// lib/ai/check.ts
// AI-ийн хариуг шалгахад хэрэглэх жижиг туслах функцууд.

// 1. AI-аас ирсэн утгыг текст болгоно.
//    Текст биш зүйл (тоо, null, объект) ирвэл хоосон "" буцаана.
export function getText(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  return "";
}

// 2. Текстийг харьцуулахад бэлдэнэ:
//    - олон зай, мөр шилжилтийг нэг зай болгоно
//    - өөр өөр хашилтыг (“ ” „ « ») энгийн " болгоно
//    Үгийг өөрчлөхгүй, зөвхөн зай ба хашилтын ялгааг арилгана.
function normalize(text: string): string {
  let result = text.replace(/\s+/g, " ");
  result = result.replace(/[“”„«»]/g, '"');
  return result.trim();
}

// 3. "part" текст "whole" текст дотор үг үсгээр нь байгаа эсэхийг шалгана.
//    AI зохиосон ишлэлийг барьж авахад хэрэглэнэ.
export function isInText(part: string, whole: string): boolean {
  if (part.trim() === "") {
    return false; // хоосон ишлэлийг хүлээж авахгүй
  }
  return normalize(whole).includes(normalize(part));
}

// 4. Текст доторх бүх тоог олно.
//    "1 000 000" ба "1,000,000" хоёулаа "1000000" болно. "3.1" → ["3", "1"]. "08" → "8".
export function findNumbers(text: string): string[] {
  // a. Мянгатын зай, таслалыг арилгана: "1 000 000" → "1000000"
  const joined = text.replace(/(\d)[\s,](?=\d{3}(?!\d))/g, "$1");
  // b. Цифрүүдийн бүлгийг олно: "40 цаг, 12 цаг" → ["40", "12"]
  const groups = joined.match(/\d+/g) || [];
  // c. Эхний тэгүүдийг арилгана: "08" → "8"
  const numbers: string[] = [];
  for (const group of groups) {
    numbers.push(group.replace(/^0+(?=\d)/, ""));
  }
  return numbers;
}

// 5. "part" доторх тоо бүр "whole" дотор байгаа эсэхийг шалгана.
//    "whole"-д БАЙХГҮЙ тоонуудыг буцаана. Хоосон жагсаалт = бүх тоо зөв.
//    AI "12 сар"-ыг "1 жил" гэж бичих, эсвэл шинэ тоо зохиохыг барьж авна.
export function findMissingNumbers(part: string, whole: string): string[] {
  const allowed = findNumbers(whole);
  const missing: string[] = [];
  for (const number of findNumbers(part)) {
    if (!allowed.includes(number) && !missing.includes(number)) {
      missing.push(number);
    }
  }
  return missing;
}

// 6. Хэдэн өгүүлбэр байгааг тоолно.
//    ". ! ? …" тэмдгийн дараа зай эсвэл текстийн төгсгөл ирвэл нэг өгүүлбэр дууссан гэж үзнэ.
//    "3.1 дэх" шиг тооны доторх цэгийг тоолохгүй.
export function countSentences(text: string): number {
  const trimmed = text.trim();
  if (trimmed === "") {
    return 0;
  }
  const ends = trimmed.match(/[.!?…]+(\s|$)/g) || [];
  // Сүүлийн өгүүлбэр цэггүй дууссан бол түүнийг ч нэмж тоолно
  const lastChar = trimmed[trimmed.length - 1];
  if (![".", "!", "?", "…"].includes(lastChar)) {
    return ends.length + 1;
  }
  return ends.length;
}
