// scripts/test-vote-hook.ts
// makeVoteHook-ийг туршина: эхлээд шалгагчийг AI-гүйгээр, дараа нь демо төсөл дээр.
// Ажиллуулах: npx tsx --env-file=.env scripts/test-vote-hook.ts
//             AI_STUB=true npx tsx scripts/test-vote-hook.ts   (AI дуудахгүй)

import { readFileSync } from "node:fs";
import { makeVoteHook, findVoteHookProblem } from "../lib/ai/vote-hook";

const TITLE = readFileSync("data/title.txt", "utf8").trim();
const SUMMARY = readFileSync("data/bill.txt", "utf8").trim();
const SOURCE = `${TITLE}\n${SUMMARY}`;

// ── Шалгагчийн тест (AI-гүй) ──
const CHECKS = [
  { question: "Долоо хоногт 12 цаг илүү ажиллуулахыг УИХ дэмжих үү?", shouldPass: true },
  { question: "Энэ төслийг УИХ дэмжих үү?", shouldPass: true },
  { question: "Илүү цагийг 20 цаг болгохыг УИХ дэмжих үү?", shouldPass: false }, // 20 төсөлд алга
  { question: "Д.Батболдын өргөн барьсан төслийг дэмжих үү?", shouldPass: false }, // хүний нэр
  { question: "Энэ төслийг УИХ дэмжинэ.", shouldPass: false }, // асуулт биш
  {
    question: "Ажил олгогч ажилтны бичгээр гаргасан зөвшөөрлийн дагуу илүү цагаар ажиллуулахыг УИХ дэмжих үү?",
    shouldPass: false, // 70-аас урт
  },
];

async function main() {
  console.log("══ Шалгагч (AI-гүй)");
  let failures = 0;
  for (const check of CHECKS) {
    const problem = findVoteHookProblem(check.question, SOURCE);
    const passed = problem === "";
    const ok = passed === check.shouldPass;
    if (!ok) {
      failures++;
    }
    console.log(`   ${ok ? "✅" : "❌"} "${check.question}" → ${passed ? "тэнцсэн" : `хаягдсан (${problem})`}`);
  }

  console.log("\n══ makeVoteHook | AI_STUB =", process.env.AI_STUB || "(тохируулаагүй)");
  const question = await makeVoteHook(TITLE, SUMMARY);
  console.log(`   → ${question === null ? "null (Dev 3 энгийн асуулт харуулна)" : `${question}  (${question.length} тэмдэгт)`}`);

  if (failures > 0) {
    console.log(`\n❌ Шалгагчийн ${failures} тест буруу`);
    process.exit(1);
  }
}

main();
