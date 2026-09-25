// lib/ai/precomputed.ts
// data/precomputed.json-ийн хэлбэр ба шалгагч.
// scripts/precompute.ts үүнийг бичдэг, scripts/apply-review.ts засдаг, Dev 1-ийн seed.ts уншдаг.

import type { Persona } from "./card";
import type { FilterStatus } from "./comments";

// ── Төсөл ──
export type PrecomputedClause = {
  number: string; // "35.1"
  oldText: string | null;
  newText: string | null;
  changeType: "ADDED" | "REMOVED" | "CHANGED";
  sourceQuote: string | null; // төслөөс яг хуулсан өгүүлбэр
  what: string | null; // explainChange
  why: string | null;
  who: string | null;
};

export type PrecomputedBill = {
  key: string; // "demo" эсвэл "lf-123"
  lawforumId?: number;
  title: string;
  summary: string;
  sourceUrl: string;
  comparison?: PrecomputedClause[]; // зөвхөн демо төсөлд
};

// ── Карт ба сорил ──
export type PrecomputedQuiz = {
  question: string;
  options: string[]; // 3–4
  correctIndex: number;
  explanation: string;
  keyPhrase?: string; // хянахад: зөв хариултыг батлах ишлэл
};

export type PrecomputedCard = {
  key: string; // "demo-35.1", "lf-123"
  kind: "BILL" | "CHANGE";
  projectKey: string; // bills[].key
  clauseNumber?: string; // CHANGE картад
  emoji: string;
  hook: string;
  before?: string | null;
  after?: string | null;
  youMeaning: string;
  personas: Persona[];
  sourceUrl: string;
  order: number; // 1-ээс эхэлнэ, бага нь түрүүнд
  sourceQuote?: string; // хянахад: картыг батлах ишлэл
  quiz: PrecomputedQuiz[];
};

// ── Санал хураалтын таамаг ──
export type PrecomputedVoteEvent = {
  agendaCode: string;
  title: string;
  hook: string;
  isReplay: boolean;
};

// ── Демо санал, бүлэг ──
export type PrecomputedComment = {
  key: string; // "c1"
  clauseNumber: string;
  name: string;
  vote: string;
  text: string;
  filterStatus: FilterStatus;
  filterReason: string;
};

export type PrecomputedGroup = {
  key: string; // "g1"
  clauseNumber: string;
  title: string;
  summary: string;
  commentKeys: string[];
  replyDraft: string;
  demoReflectable: boolean; // демод "Тусгасан" гэж тэмдэглэхэд тохиромжтой бүлэг
};

export type Precomputed = {
  generatedAt: string;
  model: string;
  bills: PrecomputedBill[];
  cards: PrecomputedCard[];
  voteEvents: PrecomputedVoteEvent[];
  comments: PrecomputedComment[];
  groups: PrecomputedGroup[];
  // Нөөц: Dev 1-ийн seed эдгээрийг УНШДАГГҮЙ тул сайтад харагдахгүй.
  // Тайзан дээр карт буруу байвал review.md-ээр нөөцийг cards руу шилжүүлж, seed дахин ажиллуулна.
  backupCards?: PrecomputedCard[];
  backupVoteEvents?: PrecomputedVoteEvent[];
};

const PERSONAS = ["STUDENT", "DRIVER", "WORKER", "PARENT", "ALL"];
export const MAX_HOOK_LENGTH = 60;
export const QUIZ_SIZE = 3;

// ── Шалгагч ──
// Алдааны жагсаалт буцаана. Хоосон жагсаалт = бүх зүйл зөв.
export function validatePrecomputed(data: Precomputed): string[] {
  const problems: string[] = [];
  const billKeys = data.bills.map((b) => b.key);
  const cardKeys: string[] = [];

  // Нөөц картуудыг ч мөн адил шалгана (тайзан дээр ашиглаж магадгүй)
  for (const card of [...data.cards, ...(data.backupCards || [])]) {
    const name = `карт ${card.key}`;

    // 1. Түлхүүр давхардаагүй, төсөл нь байгаа
    if (cardKeys.includes(card.key)) {
      problems.push(`${name}: key давхардсан`);
    }
    cardKeys.push(card.key);
    if (!billKeys.includes(card.projectKey)) {
      problems.push(`${name}: projectKey "${card.projectKey}" bills-д алга`);
    }

    // 2. Картын текстүүд
    if (card.hook.trim() === "") {
      problems.push(`${name}: hook хоосон`);
    }
    if (card.hook.length > MAX_HOOK_LENGTH) {
      problems.push(`${name}: hook ${card.hook.length} тэмдэгт (${MAX_HOOK_LENGTH}-аас урт)`);
    }
    if (card.youMeaning.trim() === "") {
      problems.push(`${name}: youMeaning хоосон`);
    }
    if (card.emoji.trim() === "") {
      problems.push(`${name}: emoji хоосон`);
    }
    if (card.personas.length === 0 || card.personas.some((p) => !PERSONAS.includes(p))) {
      problems.push(`${name}: personas буруу (${card.personas.join(", ")})`);
    }
    if (card.sourceUrl.trim() === "") {
      problems.push(`${name}: sourceUrl хоосон`);
    }

    // 3. Сорил: яг 3 асуулт, асуулт бүр 3–4 хариулттай, correctIndex зөв
    if (card.quiz.length !== QUIZ_SIZE) {
      problems.push(`${name}: ${card.quiz.length} асуулт (${QUIZ_SIZE} байх ёстой)`);
    }
    card.quiz.forEach((q, i) => {
      const qName = `${name} асуулт ${i + 1}`;
      if (q.question.trim() === "" || q.explanation.trim() === "") {
        problems.push(`${qName}: асуулт эсвэл тайлбар хоосон`);
      }
      if (q.options.length < 3 || q.options.length > 4 || q.options.some((o) => o.trim() === "")) {
        problems.push(`${qName}: ${q.options.length} хариулт эсвэл хоосон хариулт`);
      }
      if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
        problems.push(`${qName}: correctIndex ${q.correctIndex} буруу`);
      }
    });
  }

  // 4. Санал хураалтын асуулт
  for (const event of [...data.voteEvents, ...(data.backupVoteEvents || [])]) {
    if (event.hook.trim() === "" || event.agendaCode.trim() === "") {
      problems.push(`санал хураалт ${event.agendaCode}: hook эсвэл agendaCode хоосон`);
    }
  }

  // 5. Бүлгийн саналууд байгаа эсэх
  const commentKeys = data.comments.map((c) => c.key);
  for (const group of data.groups) {
    for (const key of group.commentKeys) {
      if (!commentKeys.includes(key)) {
        problems.push(`бүлэг ${group.key}: санал "${key}" comments-д алга`);
      }
    }
  }
  return problems;
}

// ── review.md-ийн сорилын хариултууд ──
// Сорилын хариултууд текстээр: "8 цаг ‖ ✔12 цаг ‖ 40 цаг" (✔ = зөв хариулт)
export function optionsToText(options: string[], correctIndex: number): string {
  return options.map((o, i) => (i === correctIndex ? `✔${o}` : o)).join(" ‖ ");
}

// Эсрэгээр нь: "8 цаг ‖ ✔12 цаг ‖ 40 цаг" → { options, correctIndex }. ✔ яг нэг биш бол null.
export function textToOptions(text: string): { options: string[]; correctIndex: number } | null {
  const parts = text.split("‖").map((part) => part.trim());
  const options: string[] = [];
  let correctIndex = -1;
  for (const part of parts) {
    if (part.startsWith("✔")) {
      if (correctIndex !== -1) {
        return null; // хоёр ✔ байна
      }
      correctIndex = options.length;
      options.push(part.slice(1).trim());
    } else {
      options.push(part);
    }
  }
  if (correctIndex === -1) {
    return null;
  }
  return { options, correctIndex };
}
