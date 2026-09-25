// lib/ai/client.ts
// Бүх AI функц AI-тай ЭНЭ файлаар дамжиж ярина.
// Дараалал: Gemini үндсэн загвар → Gemini нөөц загварууд → Claude (түлхүүр байвал).
// Завгүй (429/503) үед л дараагийнх руу шилжинэ.
//
// .env тохиргоо:
//   AI_PROVIDER=gemini   (анхдагч) дээрх дарааллаар
//   AI_PROVIDER=claude   Gemini-г алгасаад шууд Claude
//   GEMINI_API_KEY
//   GEMINI_MODEL                 үндсэн загвар (анхдагч "gemini-3.5-flash-lite")
//   GEMINI_FALLBACK_MODELS       нөөц загварууд, таслалаар: "gemini-3.1-pro-preview,gemini-3.6-flash"
//   ANTHROPIC_API_KEY, ANTHROPIC_MODEL (анхдагч "claude-sonnet-5") — заавал биш

import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";

// 1. Claude-ийн загварын нэр
const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

// 2. Gemini-тэй холбогдох
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Нэг Gemini загварыг хэдэн удаа оролдох вэ (дараа нь дараагийн загвар руу шилжинэ)
const MAX_ATTEMPTS = 2;

// ── ГОЛ ФУНКЦ: prompt илгээж, JSON хариу авна ──
// Нэр нь "askGeminiJSON" хэвээр (бусад файлууд үүнийг дууддаг), гэхдээ Claude ч хариулж болно.
export async function askGeminiJSON(prompt: string) {
  // 1. AI_PROVIDER=claude бол Gemini-г огт дуудахгүй
  if (process.env.AI_PROVIDER === "claude") {
    return askClaude(prompt);
  }

  // 2. Gemini загваруудыг дарааллаар нь оролдоно
  const models = getGeminiModels();
  for (const model of models) {
    try {
      return await askGemini(prompt, model);
    } catch (error) {
      // Завгүй биш өөр алдаа бол (буруу түлхүүр гэх мэт) шууд дээш дамжуулна
      if (!isBusyError(error)) {
        throw error;
      }
      console.log(`${model} завгүй байна → дараагийн загвар руу шилжиж байна...`);
    }
  }

  // 3. Бүх Gemini загвар завгүй → Claude руу шилжинэ
  console.log("Бүх Gemini загвар завгүй → Claude руу шилжиж байна...");
  return askClaude(prompt);
}

// Gemini загваруудын жагсаалт: эхлээд үндсэн, дараа нь нөөц загварууд
function getGeminiModels(): string[] {
  const models: string[] = [process.env.GEMINI_MODEL || "gemini-3.5-flash-lite"];
  const fallbackText = process.env.GEMINI_FALLBACK_MODELS || "";
  for (const name of fallbackText.split(",")) {
    const cleanName = name.trim();
    if (cleanName !== "" && !models.includes(cleanName)) {
      models.push(cleanName);
    }
  }
  return models;
}

// ── Нэг Gemini загвараас асуух (завгүй бол хүлээгээд дахин оролдоно) ──
async function askGemini(prompt: string, model: string) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await gemini.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json", // "зөвхөн JSON буцаа" гэж хэлнэ
          temperature: 0.2, // бага утга = тогтвортой, зохиомол багатай хариу
        },
      });
      console.log(`AI хариулсан: Gemini (${model})`);
      return parseJSON(response.text || "");
    } catch (error) {
      // Завгүй биш алдаа эсвэл сүүлийн оролдлого бол алдааг дээш нь дамжуулна
      if (!isBusyError(error) || attempt === MAX_ATTEMPTS) {
        console.log(`${model} алдаа (${attempt}-р оролдлого):`, String(error).slice(0, 200));
        throw error;
      }
      console.log(`${model} завгүй (${attempt}-р оролдлого), 5 секунд хүлээнэ...`);
      await wait(5000);
    }
  }
  throw new Error("Gemini хариу өгсөнгүй");
}

// ── Claude-аас асуух ──
async function askClaude(prompt: string) {
  // 1. Түлхүүр байхгүй бол шилжих боломжгүй
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY .env-д алга тул Claude руу шилжиж чадсангүй.");
  }

  // 2. Claude-д JSON mode байхгүй тул prompt-ын төгсгөлд "зөвхөн JSON" гэж нэмж хэлнэ
  const claude = new Anthropic({ apiKey });
  const response = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 8000,
    messages: [
      {
        role: "user",
        content: prompt + "\n\nЗӨВХӨН JSON буцаа. JSON-оос өөр ямар ч текст бүү бич.",
      },
    ],
  });

  // 3. Хариуны текст хэсгүүдийг нийлүүлнэ
  let text = "";
  for (const block of response.content) {
    if (block.type === "text") {
      text += block.text;
    }
  }
  console.log(`AI хариулсан: Claude (${CLAUDE_MODEL})`);
  return parseJSON(text);
}

// ── Туслах функцууд ──

// Текстээс JSON объект гаргаж авна.
// Эхний "{"-ээс сүүлийн "}" хүртэлх хэсгийг авдаг тул ```json ... ``` хүрээ, илүү текст байсан ч болно.
// JSON эвдэрхий байвал хоосон объект {} буцаана → функцууд "буруу хэлбэр" гэж үзээд хоосон үр дүн өгнө.
function parseJSON(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    console.log("AI JSON буцаасангүй:", text.slice(0, 200));
    return {};
  }
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    console.log("AI эвдэрхий JSON буцаалаа:", text.slice(0, 200));
    return {};
  }
}

// Алдаа нь "завгүй" (429 лимит, 503 ачаалал) төрлийнх эсэх
function isBusyError(error: unknown): boolean {
  const message = String(error);
  return message.includes("429") || message.includes("503");
}

// Хэдэн миллисекунд хүлээх
function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
