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
