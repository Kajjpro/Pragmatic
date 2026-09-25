// scripts/test-card.ts
// makeCard-ийг туршина.
//   1-р хэсэг: checkCard (шалгагч)-ийг AI-гүйгээр, гараар бичсэн "AI хариу"-гаар туршина.
//              Зохиомол тоо, урт hook, худал ишлэл зэргийг барьж авч байгаа эсэх.
//   2-р хэсэг: makeCard-ийг демо хуулийн 2 жинхэнэ жишээн дээр ажиллуулна.
// Ажиллуулах: npx tsx --env-file=.env scripts/test-card.ts
//             AI_STUB=true npx tsx scripts/test-card.ts   (AI дуудахгүй)

import { readFileSync } from "node:fs";
import { makeCard, checkCard, CardInput } from "../lib/ai/card";

// ── Жишээ 1: нэг заалтын өөрчлөлт (Хөдөлмөрийн тухай хуулийн 35.1, илүү цаг) ──
const OVERTIME: CardInput = {
  kind: "CHANGE",
  // Шалгагчийн тест data/-аас хамаарахгүй байхын тулд гарчиг, үндэслэл тогтмол (тоогүй) текст
  title: "Хөдөлмөрийн тухай хуулийн илүү цагийн заалт (шалгагчийн жишээ)",
  before:
    "Ажлын цагийн дээд хязгаар долоо хоногт 40 цаг байна. Ажил олгогч ажилтны зөвшөөрснөөр долоо хоногт 8 цаг хүртэл илүү цагаар ажиллуулж болно.",
  after:
    "Ажлын цагийн дээд хязгаар долоо хоногт 40 цаг байна. Ажил олгогч ажилтны бичгээр гаргасан зөвшөөрлийн дагуу долоо хоногт 12 цаг хүртэл илүү цагаар ажиллуулж болох бөгөөд сарын илүү цагийн нийт хэмжээ 40 цагаас хэтрэхгүй. Илүү цагаар ажиллуулахдаа ажилтны эрүүл мэнд, амралтын хугацааг харгалзана.",
  reasonText: "Ажилтны зөвшөөрлийг бичгээр авч, илүү цагийн нийт хэмжээг хязгаарлах шаардлагатай.",
};

// ── Жишээ 2: бүтэн төсөл (data/ хавтасны жинхэнэ төсөл, үндэслэл) ──
const WHOLE_BILL: CardInput = {
  kind: "BILL",
  title: readFileSync("data/title.txt", "utf8").trim(),
  summaryText: readFileSync("data/bill.txt", "utf8").trim(),
  reasonText: readFileSync("data/reason.txt", "utf8").trim(),
};

// ── 1-р хэсэг: шалгагчийн тест (AI-гүй) ──
// Шалгагч OVERTIME-ийн текстийг эх сурвалж гэж үзнэ
const SOURCE = [OVERTIME.title, OVERTIME.before, OVERTIME.after, OVERTIME.reasonText].join("\n");
const GOOD_QUOTE = "долоо хоногт 12 цаг хүртэл илүү цагаар ажиллуулж болох";

const CHECKS = [
  {
    name: "Зөв карт → тэнцэх ёстой",
    shouldPass: true,
    answer: {
      emoji: "⏰",
      hook: "Долоо хоногт 12 цаг илүү ажиллаж болох уу?",
      youMeaning: "Чи ажил хийдэг бол ажил олгогч чамайг бичгээр зөвшөөрсөн үед л 12 цаг хүртэл илүү ажиллуулж болно.",
      personas: ["WORKER"],
      quote: GOOD_QUOTE,
    },
  },
  {
    name: "Зохиомол тоо (50%) → хаягдах ёстой",
    shouldPass: false,
    answer: {
      emoji: "⏰",
      hook: "Илүү цагийн хөлс 50% нэмэгдэнэ",
      youMeaning: "Чи илүү цаг ажиллавал илүү мөнгө авна.",
      personas: ["WORKER"],
      quote: GOOD_QUOTE,
    },
  },
  {
    name: 'Нэгж хөрвүүлж зохиосон тоо ("1 өдөр") → хаягдах ёстой',
    shouldPass: false,
    answer: {
      emoji: "⏰",
      hook: "Илүү цаг 1 өдрөөс их болно",
      youMeaning: "Чи ажил хийдэг бол илүү цаг чинь нэмэгдэж магадгүй.",
      personas: ["WORKER"],
      quote: GOOD_QUOTE,
    },
  },
  {
    name: "60-аас урт hook → хаягдах ёстой",
    shouldPass: false,
    answer: {
      emoji: "⏰",
      hook: "Ажил олгогч ажилтны бичгээр гаргасан зөвшөөрлийн дагуу долоо хоногт 12 цаг хүртэл илүү ажиллуулна",
      youMeaning: "Чи ажил хийдэг бол илүү цагаа бичгээр зөвшөөрнө.",
      personas: ["WORKER"],
      quote: GOOD_QUOTE,
    },
  },
  {
    name: "Текстэд байхгүй ишлэл → хаягдах ёстой",
    shouldPass: false,
    answer: {
      emoji: "⏰",
      hook: "Илүү цагийн дүрэм өөрчлөгдөнө",
      youMeaning: "Чи ажил хийдэг бол энэ чамд хамаатай.",
      personas: ["WORKER"],
      quote: "илүү цагийн хөлсийг хоёр дахин нэмэгдүүлнэ",
    },
  },
  {
    name: '"Чи"-гээр хандаагүй → хаягдах ёстой',
    shouldPass: false,
    answer: {
      emoji: "⏰",
      hook: "Долоо хоногт 12 цаг илүү ажиллаж болох уу?",
      youMeaning: "Ажилтныг бичгээр зөвшөөрсөн үед 12 цаг хүртэл илүү ажиллуулж болно.",
      personas: ["WORKER"],
      quote: GOOD_QUOTE,
    },
  },
  {
    name: "3 өгүүлбэртэй youMeaning → хаягдах ёстой",
    shouldPass: false,
    answer: {
      emoji: "⏰",
      hook: "Долоо хоногт 12 цаг илүү ажиллаж болох уу?",
      youMeaning: "Чи ажил хийдэг. Ажил олгогч чинь чамаас зөвшөөрөл авна. Дараа нь 12 цаг илүү ажиллуулж болно.",
      personas: ["WORKER"],
      quote: GOOD_QUOTE,
    },
  },
  {
    name: "Буруу personas (STUDENTS, TEACHER) → хаягдах ёстой",
    shouldPass: false,
    answer: {
      emoji: "⏰",
      hook: "Долоо хоногт 12 цаг илүү ажиллаж болох уу?",
      youMeaning: "Чи ажил хийдэг бол 12 цаг хүртэл илүү ажиллаж болно.",
      personas: ["STUDENTS", "TEACHER"],
      quote: GOOD_QUOTE,
    },
  },
  {
    name: "Буруу хэлбэр (жагсаалт) → хаягдах ёстой, унахгүй",
    shouldPass: false,
    answer: ["hook", "youMeaning"],
  },
];

function runChecks(): number {
  console.log("══ 1-р хэсэг: шалгагч (AI-гүй)");
  let failures = 0;
  for (const check of CHECKS) {
    const { card, problem } = checkCard(check.answer, SOURCE);
    const passed = card !== null;
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

// ── 2-р хэсэг: makeCard 2 жишээн дээр ──
async function runSamples() {
  console.log("══ 2-р хэсэг: makeCard | AI_STUB =", process.env.AI_STUB || "(тохируулаагүй)");
  const samples = [
    { name: "Жишээ 1 — 35.1 илүү цаг (CHANGE)", input: OVERTIME },
    { name: "Жишээ 2 — бүтэн төсөл (BILL)", input: WHOLE_BILL },
  ];
  for (const sample of samples) {
    console.log(`\n── ${sample.name}`);
    const card = await makeCard(sample.input);
    if (card === null) {
      console.log("   → Карт гарсангүй (null)");
      continue;
    }
    console.log(`   emoji     : ${card.emoji}`);
    console.log(`   hook      : ${card.hook}  (${card.hook.length} тэмдэгт)`);
    console.log(`   youMeaning: ${card.youMeaning}`);
    console.log(`   personas  : ${card.personas.join(", ")}`);
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
