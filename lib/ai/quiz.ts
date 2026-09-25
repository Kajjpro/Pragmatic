// lib/ai/quiz.ts
// Нэг картын текстээс 3 асуулттай богино тоглоом (quiz) хийнэ:
//   WHAT_CHANGED — юу өөрчлөгдөж байна вэ?
//   WHO          — хэнд хамаатай вэ?
//   TRUE_FALSE   — "Аль нь үнэн бэ?" (3-4 мэдэгдлээс нэг нь л үнэн)
// Зөв хариулт бүр картын текстээр батлагдах ёстой. Батлагдахгүй асуултыг хаяна.

import { askGeminiJSON } from "./client";
import { getText, isInText, findMissingNumbers } from "./check";
import type { Card, CardInput } from "./card";

// ── Гаралт ──
export type QuizKind = "WHAT_CHANGED" | "WHO" | "TRUE_FALSE";

export type QuizQuestion = {
  kind: QuizKind;
  question: string;
  options: string[]; // 3-4 богино хариулт
  correctIndex: number; // зөв хариултын байрлал (0-оос эхэлнэ)
  explanation: string; // яагаад зөв болохыг 1 өгүүлбэрээр
};

const QUIZ_KINDS: QuizKind[] = ["WHAT_CHANGED", "WHO", "TRUE_FALSE"];
const MIN_OPTIONS = 3;
const MAX_OPTIONS = 4;
const MIN_KEY_PHRASE_LENGTH = 6; // "нь" шиг хэт богино ишлэлийг хүлээж авахгүй

export async function makeQuiz(cardText: string): Promise<QuizQuestion[]> {
  // 1. STUB горим: AI дуудахгүй, шууд хуурамч асуултууд
  if (process.env.AI_STUB === "true") {
    return fakeQuiz(cardText);
  }

  // 2. Текст хоосон бол асуулт гаргах зүйл алга
  if (cardText.trim() === "") {
    return [];
  }

  // 3. AI-аас асуух. AI эсвэл сүлжээний алдаа гарвал унахгүй, асуултгүй үлдэнэ.
  let result;
  try {
    result = await askGeminiJSON(makePrompt(cardText));
  } catch (error) {
    console.log("makeQuiz: AI алдаа, асуултгүй үлдлээ →", String(error).slice(0, 200));
    return [];
  }

  // 4. AI {"questions": [...]} хэлбэрээр буцаах ёстой. Өөр хэлбэртэй бол хоосон жагсаалт.
  if (!result || !Array.isArray(result.questions)) {
    console.log("makeQuiz: AI буруу хэлбэртэй хариу өгсөн:", result);
    return [];
  }

  // 5. Асуулт бүрийг шалгаж, тэнцсэнийг нь үлдээнэ. Төрөл бүрээс нэг л асуулт.
  const quiz: QuizQuestion[] = [];
  for (const item of result.questions) {
    const { question, problem } = checkQuestion(item, cardText);
    if (question === null) {
      console.log("makeQuiz: асуултыг хаялаа →", problem);
      continue;
    }
    if (quiz.some((q) => q.kind === question.kind)) {
      continue; // энэ төрлийн асуулт аль хэдийн байна
    }
    quiz.push(moveCorrectAnswer(question));
  }
  return quiz;
}

// ── Картаас quiz-д өгөх текст бэлдэнэ ──
// Зөвхөн AI бичсэн hook биш, хуулийн жинхэнэ текстийг (хуучин/шинэ заалт) хамт өгнө.
export function makeQuizText(input: CardInput, card: Card): string {
  let text = `Төсөл: ${input.title}\n`;
  if (input.before) {
    text += `Хуучин заалт: ${input.before}\n`;
  }
  if (input.after) {
    text += `Шинэ заалт: ${input.after}\n`;
  }
  if (input.summaryText) {
    text += `Товч агуулга: ${input.summaryText}\n`;
  }
  text += `${card.hook}\n${card.youMeaning}`;
  return text;
}

// ── AI-ийн нэг асуултыг шалгана ──
// Тэнцвэл { question, problem: "" }, тэнцэхгүй бол { question: null, problem: "юу буруу" }.
// scripts/test-quiz.ts үүнийг AI-гүйгээр шууд туршдаг.
export function checkQuestion(item: unknown, cardText: string): { question: QuizQuestion | null; problem: string } {
  // 1. Объект биш бол буруу хэлбэр
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return { question: null, problem: "JSON объект биш" };
  }
  const raw = item as Record<string, unknown>;

  // 2. Төрөл нь 3 төрлийн нэг байх
  const kind = getText(raw.kind) as QuizKind;
  if (!QUIZ_KINDS.includes(kind)) {
    return { question: null, problem: `буруу төрөл: "${kind}"` };
  }

  // 3. Асуулт, тайлбар хоосон биш
  const questionText = getText(raw.question);
  const explanation = getText(raw.explanation);
  if (questionText === "" || explanation === "") {
    return { question: null, problem: "асуулт эсвэл тайлбар хоосон" };
  }

  // 4. Хариултууд: 3-4 ширхэг, хоосон биш, давхардаагүй
  if (!Array.isArray(raw.options)) {
    return { question: null, problem: "options жагсаалт биш" };
  }
  const options: string[] = [];
  for (const option of raw.options) {
    const text = getText(option);
    if (text === "" || options.includes(text)) {
      return { question: null, problem: "хоосон эсвэл давхардсан хариулт" };
    }
    options.push(text);
  }
  if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) {
    return { question: null, problem: `${options.length} хариулт (${MIN_OPTIONS}-${MAX_OPTIONS} байх ёстой)` };
  }

  // 5. correctIndex: бүхэл тоо, хариултуудын дотор
  const correctIndex = raw.correctIndex;
  if (typeof correctIndex !== "number" || !Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
    return { question: null, problem: `буруу correctIndex: ${String(correctIndex)}` };
  }

  // 6. Зөв хариултыг батлах ишлэл (keyPhrase) картын текстэд үг үсгээрээ байх ёстой
  const keyPhrase = getText(raw.keyPhrase);
  if (keyPhrase.length < MIN_KEY_PHRASE_LENGTH || !isInText(keyPhrase, cardText)) {
    return { question: null, problem: `keyPhrase картын текстэд алга: "${keyPhrase}"` };
  }

  // 7. Асуулт, зөв хариулт, тайлбар дахь тоо бүр картын текстэд байх ёстой
  //    (буруу хариултуудад зохиомол тоо байж болно — тэд санаатай буруу)
  const missing = findMissingNumbers(`${questionText} ${options[correctIndex]} ${explanation}`, cardText);
  if (missing.length > 0) {
    return { question: null, problem: `картын текстэд байхгүй тоо: ${missing.join(", ")}` };
  }

  return { question: { kind, question: questionText, options, correctIndex, explanation }, problem: "" };
}

// AI зөв хариултыг ихэвчлэн эхэнд тавьдаг. Санамсаргүй байрлал руу сольж тавина.
function moveCorrectAnswer(question: QuizQuestion): QuizQuestion {
  const options = [...question.options];
  const newIndex = Math.floor(Math.random() * options.length);
  // Зөв хариулт ба newIndex дээрх хариултыг байрыг нь солино
  const correct = options[question.correctIndex];
  options[question.correctIndex] = options[newIndex];
  options[newIndex] = correct;
  return { ...question, options, correctIndex: newIndex };
}

// ── AI-д өгөх заавар ──
function makePrompt(cardText: string): string {
  return `Чи 16-18 насны залууст зориулсан богино хуулийн тоглоомд асуулт бичдэг туслах.
Асуултыг ЗӨВХӨН доорх картын текстэд тулгуурлан бич.

КАРТЫН ТЕКСТ:
"""
${cardText}
"""

Яг 3 асуулт бич, төрөл бүрээс нэг:
1. WHAT_CHANGED — юу өөрчлөгдөж байна вэ?
2. WHO — энэ өөрчлөлт хэнд хамаатай вэ?
3. TRUE_FALSE — "Аль нь үнэн бэ?" хэлбэртэй: хариултууд нь мэдэгдэл, тэдгээрээс ЗӨВХӨН нэг нь үнэн.

Асуулт бүрт:
- kind: WHAT_CHANGED, WHO эсвэл TRUE_FALSE.
- question: богино асуулт (ихдээ 80 тэмдэгт).
- options: ${MIN_OPTIONS}-${MAX_OPTIONS} богино хариулт (тус бүр ихдээ 50 тэмдэгт). Яг нэг нь зөв. Буруу хариултууд итгэмээр боловч картын текстээр тодорхой буруу байх.
- correctIndex: зөв хариултын байрлал, 0-оос эхэлнэ.
- explanation: яагаад зөв болохыг 1 өгүүлбэрээр.
- keyPhrase: зөв хариултыг батлах хэсгийг картын текстээс ЯГ ХУУЛЖ бич (нэг ч үсэг өөрчлөхгүй, 3-15 үг).

ДҮРЭМ:
- Зөв хариулт, тайлбарт гарах тоо бүр картын текстэд байх ёстой. Тоог цифрээр бич.
- Картын текстэд байхгүй баримт бүү зохио.
- "Бүгд зөв", "Аль нь ч биш" гэсэн хариулт бүү хэрэглэ.
- Энгийн монгол хэл. Хуулийг сайн, муу гэж бүү үнэл.

ЗӨВХӨН ИЙМ JSON БУЦАА:
{"questions": [{"kind": "WHAT_CHANGED", "question": "...", "options": ["...", "...", "..."], "correctIndex": 0, "explanation": "...", "keyPhrase": "..."}]}`;
}

// ── Хуурамч өгөгдөл (AI дуудахгүй) ──
// Демо хуулийн сэдвээр: текстэд "чөлөө" байвал 22.1 (эцэг эхийн чөлөө), үгүй бол 35.1 (илүү цаг)
function fakeQuiz(cardText: string): QuizQuestion[] {
  if (cardText.includes("чөлөө")) {
    return [
      {
        kind: "WHAT_CHANGED",
        question: "Эцэг эх нийт хэдэн сарын хамтын чөлөө авах вэ?",
        options: ["6 сар", "24 сар", "12 сар"],
        correctIndex: 2,
        explanation: "Шинэ заалтад нийт 12 сарын хугацаанд эцэг эхийн хамтын чөлөө эдлэх эрхтэй гэж заасан.",
      },
      {
        kind: "WHO",
        question: "Энэ чөлөөг хэн эдлэх эрхтэй вэ?",
        options: ["Эх, эцэг болсон ажилтан", "Зөвхөн ээж", "Ахмад настан"],
        correctIndex: 0,
        explanation: "Заалтад ажилтан эх, эцэг болсон тохиолдолд чөлөө эдлэх эрхтэй гэж заасан.",
      },
      {
        kind: "TRUE_FALSE",
        question: "Аль нь үнэн бэ?",
        options: [
          "Чөлөөг зөвхөн ээж авна",
          "Ээж, аав чөлөөг тохиролцож хуваарилж болно",
          "Чөлөө 12 долоо хоног үргэлжилнэ",
        ],
        correctIndex: 1,
        explanation: "Заалтад чөлөөг эцэг эх хоорондоо харилцан тохиролцож хуваарилж болно гэж заасан.",
      },
    ];
  }

  return [
    {
      kind: "WHAT_CHANGED",
      question: "Долоо хоногт хэдэн цаг хүртэл илүү ажиллуулж болох вэ?",
      options: ["8 цаг", "12 цаг", "40 цаг"],
      correctIndex: 1,
      explanation: "Шинэ заалтаар долоо хоногт 12 цаг хүртэл илүү цагаар ажиллуулж болно.",
    },
    {
      kind: "WHO",
      question: "Энэ өөрчлөлт хэнд хамгийн их хамаатай вэ?",
      options: ["Сурагчид", "Жолооч нар", "Ажил хийдэг хүмүүс"],
      correctIndex: 2,
      explanation: "Энэ заалт ажил олгогч ажилтныг илүү цагаар ажиллуулах журмыг тогтоож байна.",
    },
    {
      kind: "TRUE_FALSE",
      question: "Аль нь үнэн бэ?",
      options: [
        "Сарын илүү цаг нийт 40 цагаас хэтрэхгүй",
        "Ажилтан зөвшөөрөөгүй ч илүү цагаар ажиллуулж болно",
        "Ажлын долоо хоног 48 цаг болно",
      ],
      correctIndex: 0,
      explanation: "Шинэ заалтад сарын илүү цагийн нийт хэмжээ 40 цагаас хэтрэхгүй гэж заасан.",
    },
  ];
}
