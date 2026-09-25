// lib/law/apply.ts
// readAmendment-ийн өөрчлөлтийн жагсаалтыг хуучин заалтуудад хэрэгжүүлнэ (applyChanges). AI биш, энгийн код.

import type { Change } from "@/lib/ai/amendment";
import { LawClause, compareClauseNumbers } from "./clauses";

export type AppliedClause = {
  number: string;
  oldText: string | null; // хуучин (нэмсэн заалтад null)
  newText: string | null; // шинэ (хассан заалтад null)
  sourceQuote: string | null; // өөрчлөлтийг заасан ишлэл (өөрчлөгдөөгүй бол null)
  applyError: string | null; // хэрэгжүүлж чадаагүй бол шалтгаан
};

export function applyChanges(oldClauses: LawClause[], changes: Change[]): AppliedClause[] {
  // 1. Хуучин заалт бүрийг "өөрчлөгдөөгүй" гэж эхлүүлнэ
  const result: AppliedClause[] = [];
  for (const clause of oldClauses) {
    result.push({
      number: clause.number,
      oldText: clause.text,
      newText: clause.text,
      sourceQuote: null,
      applyError: null,
    });
  }

  // 2. Өөрчлөлт бүрийг дарааллаар нь хэрэгжүүлнэ
  for (const change of changes) {
    const clause = findClause(result, change.clause);

    // a. Шинэ заалт нэмэх
    if (change.action === "ADD") {
      if (clause === null) {
        result.push({
          number: change.clause,
          oldText: null,
          newText: change.newText || "",
          sourceQuote: change.sourceQuote,
          applyError: null,
        });
      } else {
        // Ийм дугаартай заалт аль хэдийн байвал ажилтанд анхааруулна
        clause.newText = change.newText || "";
        addQuote(clause, change.sourceQuote);
        clause.applyError = "Нэмэх гэсэн заалт хуульд аль хэдийн байна. Шалгана уу.";
      }
      continue;
    }

    // b. Бусад үйлдэлд заалт заавал байх ёстой
    if (clause === null) {
      result.push({
        number: change.clause,
        oldText: null,
        newText: null,
        sourceQuote: change.sourceQuote,
        applyError: "Хуульд ийм дугаартай заалт олдсонгүй.",
      });
      continue;
    }
    addQuote(clause, change.sourceQuote);

    // c. Хүчингүй болгох
    if (change.action === "REMOVE") {
      clause.newText = null;
      continue;
    }

    // d. Өөрчлөн найруулах
    if (change.action === "REWRITE") {
      clause.newText = change.newText || "";
      continue;
    }

    // e. Үг солих: хуучин үг заалтад байвал эхнийхийг нь солино
    if (change.action === "REPLACE_WORDS") {
      const oldWords = change.oldWords || "";
      const currentText = clause.newText || "";
      if (oldWords !== "" && currentText.includes(oldWords)) {
        clause.newText = currentText.replace(oldWords, change.newText || "");
        // Үг хассаны дараа үлдсэн давхар зайг цэвэрлэнэ
        clause.newText = clause.newText.replace(/\s{2,}/g, " ").trim();
      } else {
        clause.applyError = `“${oldWords}” гэсэн үг заалтад олдсонгүй.`;
      }
    }
  }

  // 3. Заалтуудыг дугаараар нь эрэмбэлнэ (нэмсэн заалт зөв байрандаа орно)
  result.sort((a, b) => compareClauseNumbers(a.number, b.number));
  return result;
}

// Дугаараар нь заалт хайна
function findClause(clauses: AppliedClause[], number: string): AppliedClause | null {
  for (const clause of clauses) {
    if (clause.number === number) {
      return clause;
    }
  }
  return null;
}

// Нэг заалтад хэд хэдэн өөрчлөлт орвол ишлэлүүдийг нийлүүлнэ
function addQuote(clause: AppliedClause, quote: string) {
  if (clause.sourceQuote === null) {
    clause.sourceQuote = quote;
  } else if (!clause.sourceQuote.includes(quote)) {
    clause.sourceQuote = clause.sourceQuote + "\n" + quote;
  }
}
