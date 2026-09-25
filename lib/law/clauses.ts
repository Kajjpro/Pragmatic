// lib/law/clauses.ts
// Хуулийн текстийг заалт бүрээр хуваана (splitIntoClauses). AI биш, энгийн код.
//
// Хүлээж авах хэлбэр (legalinfo.mn-ээс хуулсан текст, нэг заалт нэг мөрөнд):
//   3 дугаар зүйл.Хуулийн нэр томьёо
//   3.1.Энэ хуульд хэрэглэсэн дараах нэр томьёог ...
//   3.1.1."агаар" гэж ...

export type LawClause = {
  number: string; // "3", "3.1", "3.1.1"
  text: string; // дугааргүй текст
};

export function splitIntoClauses(lawText: string): LawClause[] {
  const clauses: LawClause[] = [];
  const lines = lawText.split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === "") {
      continue;
    }

    // 1. "3.1.текст" эсвэл "3.1.1.текст" хэлбэрийн заалт
    const clauseMatch = line.match(/^(\d+(?:\.\d+)+)\.?\s*(.*)$/);
    // 2. "3 дугаар зүйл.Гарчиг" хэлбэрийн зүйл
    const articleMatch = line.match(/^(\d+)\s+(?:дугаар|дүгээр)\s+зүйл\.?\s*(.*)$/);

    if (clauseMatch) {
      clauses.push({ number: clauseMatch[1], text: clauseMatch[2].trim() });
    } else if (articleMatch) {
      clauses.push({ number: articleMatch[1], text: articleMatch[2].trim() });
    } else if (clauses.length > 0) {
      // 3. Дугааргүй мөр = өмнөх заалтын үргэлжлэл
      const last = clauses[clauses.length - 1];
      last.text = (last.text + " " + line).trim();
    }
    // Эхний заалтаас өмнөх мөрүүдийг (хуулийн нэр гэх мэт) алгасна
  }

  return clauses;
}

// Заалтын дугаарыг тоогоор нь харьцуулна: "3.2" < "3.10" < "10.1"
export function compareClauseNumbers(a: string, b: string): number {
  const partsA = a.split(".");
  const partsB = b.split(".");
  const length = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < length; i++) {
    const numberA = Number(partsA[i] ?? -1);
    const numberB = Number(partsB[i] ?? -1);
    if (numberA !== numberB) {
      return numberA - numberB;
    }
  }
  return 0;
}
