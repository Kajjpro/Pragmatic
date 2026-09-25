// scripts/list-models.ts
// Миний GEMINI_API_KEY ямар загвар хэрэглэж чадахыг харуулна.
//   1. Түлхүүрт харагдаж буй, текст үүсгэдэг (generateContent) бүх загварыг жагсаана.
//   2. .env-ийн дарааллын загвар бүрт жижиг асуулт илгээж, үнэхээр хариулж байгаа эсэхийг шалгана.
// Ажиллуулах: npx tsx --env-file=.env scripts/list-models.ts

import { GoogleGenAI } from "@google/genai";
import { getGeminiModels, getErrorCode } from "../lib/ai/client";

async function main() {
  // 1. Түлхүүр байгаа эсэх
  if (!process.env.GEMINI_API_KEY) {
    console.log("GEMINI_API_KEY .env-д алга. Жишээ: npx tsx --env-file=.env scripts/list-models.ts");
    process.exit(1);
  }
  const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // 2. Түлхүүрт харагдаж буй загварууд
  console.log("══ Түлхүүрт харагдаж буй загварууд (generateContent):");
  const visible: string[] = [];
  try {
    const pager = await gemini.models.list();
    for await (const model of pager) {
      const actions = model.supportedActions || [];
      if (actions.includes("generateContent")) {
        const name = (model.name || "").replace("models/", "");
        visible.push(name);
        console.log(`   ${name}`);
      }
    }
  } catch (error) {
    // 400 = түлхүүр буруу, 403 = түлхүүрт Gemini API-ийн эрх алга
    console.log(`   ❌ Жагсаалт авч чадсангүй (${getErrorCode(error) || "алдаа"}): ${String(error).slice(0, 200)}`);
    process.exit(1);
  }
  console.log(`   (нийт ${visible.length})\n`);

  // 3. .env-ийн дараалал дахь загвар бүрийг жижиг асуултаар шалгана
  console.log("══ .env дараалал (GEMINI_MODEL_STRONG → GEMINI_MODEL → GEMINI_FALLBACK_MODELS):");
  for (const model of getGeminiModels()) {
    const listed = visible.includes(model) ? "жагсаалтад байна" : "жагсаалтад АЛГА";
    try {
      await gemini.models.generateContent({ model, contents: 'Зөвхөн "OK" гэж хариул.' });
      console.log(`   ✅ ${model} — хариулж байна (${listed})`);
    } catch (error) {
      console.log(`   ❌ ${model} — ${getErrorCode(error) || "алдаа"} (${listed}): ${String(error).slice(0, 120)}`);
    }
  }

  // 4. Claude нөөц
  if (process.env.ANTHROPIC_API_KEY) {
    console.log(`\n   Нөөц: Claude (${process.env.ANTHROPIC_MODEL || "claude-sonnet-5"}) — түлхүүр байна`);
  } else {
    console.log("\n   Нөөц: Claude — ANTHROPIC_API_KEY алга, Gemini бүгд унавал алдаа гарна");
  }
}

main();
