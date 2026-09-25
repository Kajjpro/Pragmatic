// scripts/test-quiz.ts
// makeQuiz-ийг туршина.
//   1-р хэсэг: checkQuestion (шалгагч)-ийг AI-гүйгээр, гараар бичсэн "AI хариу"-гаар туршина.
//   2-р хэсэг: makeQuiz-ийг демо хуулийн 2 картын текст дээр ажиллуулна.
// Ажиллуулах: npx tsx --env-file=.env scripts/test-quiz.ts
//             AI_STUB=true npx tsx scripts/test-quiz.ts   (AI дуудахгүй)

import { readFileSync } from "node:fs";
import { makeQuiz, makeQuizText, checkQuestion } from "../lib/ai/quiz";

const TITLE = readFileSync("data/title.txt", "utf8").trim();

// ── Картын текст 1: 35.1 илүү цаг ──
const OVERTIME_TEXT = makeQuizText(
  {
    kind: "CHANGE",
    title: TITLE,
    before:
      "Ажлын цагийн дээд хязгаар долоо хоногт 40 цаг байна. Ажил олгогч ажилтны зөвшөөрснөөр долоо хоногт 8 цаг хүртэл илүү цагаар ажиллуулж болно.",
    after:
      "Ажлын цагийн дээд хязгаар долоо хоногт 40 цаг байна. Ажил олгогч ажилтны бичгээр гаргасан зөвшөөрлийн дагуу долоо хоногт 12 цаг хүртэл илүү цагаар ажиллуулж болох бөгөөд сарын илүү цагийн нийт хэмжээ 40 цагаас хэтрэхгүй. Илүү цагаар ажиллуулахдаа ажилтны эрүүл мэнд, амралтын хугацааг харгалзана.",
  },
  {
    emoji: "⏰",
    hook: "Долоо хоногт 12 цаг илүү ажиллаж болох уу?",
    youMeaning: "Чи ажил хийдэг бол ажил олгогч чамайг бичгээр зөвшөөрсөн үед л 12 цаг хүртэл илүү ажиллуулж болно.",
    personas: ["WORKER"],
  }
);

// ── Картын текст 2: 22.1 эцэг эхийн хамтын чөлөө (шинээр нэмэгдэж буй заалт) ──
const LEAVE_TEXT = makeQuizText(
  {
    kind: "CHANGE",
    title: TITLE,
    before: null,
    after:
      "Ажилтан эх, эцэг болсон тохиолдолд нийт 12 сарын хугацаанд эцэг эхийн хамтын чөлөөг эдлэх эрхтэй бөгөөд уг чөлөөг эцэг эх хоорондоо харилцан тохиролцож хуваарилж болно.",
  },
  {
    emoji: "👶",
    hook: "Ээж, аав хоёр 12 сарын чөлөөг хувааж авч болно",
    youMeaning: "Чиний гэр бүлд хүүхэд төрвөл ээж, аав чинь 12 сарын чөлөөг хоорондоо тохиролцож хуваах эрхтэй болно.",
    personas: ["PARENT", "WORKER"],
  }
);

// ── 1-р хэсэг: шалгагчийн тест (AI-гүй) ──
const GOOD = {
  kind: "WHAT_CHANGED",
  question: "Долоо хоногт хэдэн цаг хүртэл илүү ажиллуулж болох вэ?",
  options: ["8 цаг", "12 цаг", "40 цаг"],
  correctIndex: 1,
  explanation: "Шинэ заалтаар долоо хоногт 12 цаг хүртэл илүү ажиллуулж болно.",
  keyPhrase: "долоо хоногт 12 цаг хүртэл илүү цагаар",
};

const CHECKS = [
  { name: "Зөв асуулт → тэнцэх ёстой", shouldPass: true, item: GOOD },
  {
    name: "Буруу хариултад зохиомол тоо (20 цаг) байж болно → тэнцэх ёстой",
    shouldPass: true,
    item: { ...GOOD, options: ["8 цаг", "12 цаг", "20 цаг"] },
  },
  {
    name: "Зөв хариултад зохиомол тоо (16) → хаягдах ёстой",
    shouldPass: false,
    item: { ...GOOD, options: ["8 цаг", "16 цаг", "40 цаг"], explanation: "Шинэ заалтаар 16 цаг болно." },
  },
  {
    name: "Картад байхгүй keyPhrase → хаягдах ёстой",
    shouldPass: false,
    item: { ...GOOD, keyPhrase: "илүү цагийн хөлсийг хоёр дахин нэмнэ" },
  },
  { name: "Хэт богино keyPhrase (\"цаг\") → хаягдах ёстой", shouldPass: false, item: { ...GOOD, keyPhrase: "цаг" } },
  { name: "correctIndex хүрээнээс гарсан (5) → хаягдах ёстой", shouldPass: false, item: { ...GOOD, correctIndex: 5 } },
  { name: "correctIndex текст (\"1\") → хаягдах ёстой", shouldPass: false, item: { ...GOOD, correctIndex: "1" } },
  { name: "Ердөө 2 хариулт → хаягдах ёстой", shouldPass: false, item: { ...GOOD, options: ["8 цаг", "12 цаг"] } },
  {
    name: "Давхардсан хариулт → хаягдах ёстой",
    shouldPass: false,
    item: { ...GOOD, options: ["12 цаг", "12 цаг", "40 цаг"] },
  },
  { name: "Буруу төрөл (OPINION) → хаягдах ёстой", shouldPass: false, item: { ...GOOD, kind: "OPINION" } },
  { name: "Буруу хэлбэр (текст) → хаягдах ёстой, унахгүй", shouldPass: false, item: "асуулт" },
];

function runChecks(): number {
  console.log("══ 1-р хэсэг: шалгагч (AI-гүй)");
  let failures = 0;
  for (const check of CHECKS) {
    const { question, problem } = checkQuestion(check.item, OVERTIME_TEXT);
    const passed = question !== null;
    const ok = passed === check.shouldPass;
    if (!ok) {
      failures++;
    }
    const result = passed ? "тэнцсэн" : `хаягдсан (${problem})`;
    console.log(`   ${ok ? "✅" : "❌"} ${check.name} → ${result}`);
  }
  console.log("");
  return failures;
}

// ── 2-р хэсэг: makeQuiz 2 картын текст дээр ──
async function runSamples() {
  console.log("══ 2-р хэсэг: makeQuiz | AI_STUB =", process.env.AI_STUB || "(тохируулаагүй)");
  const samples = [
    { name: "Жишээ 1 — 35.1 илүү цаг", text: OVERTIME_TEXT },
    { name: "Жишээ 2 — 22.1 эцэг эхийн хамтын чөлөө", text: LEAVE_TEXT },
  ];
  for (const sample of samples) {
    console.log(`\n── ${sample.name}`);
    const quiz = await makeQuiz(sample.text);
    console.log(`   ${quiz.length} асуулт`);
    for (const question of quiz) {
      console.log(`\n   [${question.kind}] ${question.question}`);
      question.options.forEach((option, index) => {
        const mark = index === question.correctIndex ? "✔" : " ";
        console.log(`     ${mark} ${index}. ${option}`);
      });
      console.log(`     → ${question.explanation}`);
    }
  }
}

async function main() {
  const failures = runChecks();
  await runSamples();
  if (failures > 0) {
    console.log(`\n❌ Шалгагчийн ${failures} тест буруу`);
    process.exit(1);
  }
}

main();
