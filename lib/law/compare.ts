// lib/law/compare.ts
// Хуучин, шинэ заалтыг үг үгээр нь харьцуулна (compareWords). AI биш, энгийн код.
//
// Анхаар: "diff" сангийн diffWords нь кирилл үсгийг үгийн дотор хуваадаг
// ("бай|на" → "бай|ж болно"). Тиймээс текстийг өөрсдөө үг болгон хувааж, diffArrays ашиглана.

import { diffArrays } from "diff";

export type WordPart = { value: string; added?: boolean; removed?: boolean };

export function compareWords(oldText: string | null, newText: string | null): WordPart[] {
  // 1. Текстийг үг ба зай болгон хуваана: "а б" → ["а", " ", "б"]
  const oldWords = splitWords(oldText || "");
  const newWords = splitWords(newText || "");

  // 2. Үгийн жагсаалтуудыг харьцуулна
  const parts = diffArrays(oldWords, newWords);

  // 3. UI-д хэрэгтэй хэлбэрт оруулна
  const result: WordPart[] = [];
  for (const part of parts) {
    result.push({
      value: part.value.join(""),
      added: part.added || undefined,
      removed: part.removed || undefined,
    });
  }
  return result;
}

function splitWords(text: string): string[] {
  const pieces = text.split(/(\s+)/); // хаалт нь зайг ч гэсэн хадгална
  const words: string[] = [];
  for (const piece of pieces) {
    if (piece !== "") {
      words.push(piece);
    }
  }
  return words;
}
