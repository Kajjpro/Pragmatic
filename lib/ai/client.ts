// lib/ai/client.ts
// Бүх AI функц AI-тай ЭНЭ файлаар дамжиж ярина.
// Эхлээд Gemini-ээс асууна. Gemini завгүй (429/503) бол Claude руу шилжинэ.
//
// .env тохиргоо:
//   AI_PROVIDER=gemini   (анхдагч) Gemini → завгүй бол Claude
//   AI_PROVIDER=claude   Gemini-г алгасаад шууд Claude
//   GEMINI_API_KEY, GEMINI_MODEL
//   ANTHROPIC_API_KEY, ANTHROPIC_MODEL (анхдагч "claude-sonnet-5")

import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";

// 1. Загварын нэрсийг .env-ээс уншина
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.7-flash";
const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

// 2. Gemini-тэй холбогдох
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Gemini-г хэдэн удаа оролдох вэ (дараа нь Claude руу шилжинэ)
const MAX_ATTEMPTS = 3;

// ── ГОЛ ФУНКЦ: prompt илгээж, JSON хариу авна ──
// Нэр нь "askGeminiJSON" хэвээр (бусад файлууд үүнийг дууддаг), гэхдээ Claude ч хариулж болно.
export async function askGeminiJSON(prompt: string) {
  // 1. AI_PROVIDER=claude бол Gemini-г огт дуудахгүй
  if (process.env.AI_PROVIDER === "claude") {
    return askClaude(prompt);
  }

  // 2. Эхлээд Gemini
  try {
    return await askGemini(prompt);
  } catch (error) {
    // 3. Gemini завгүй биш өөр алдаа бол (буруу түлхүүр гэх мэт) шууд дээш дамжуулна
    if (!isBusyError(error)) {
      throw error;
    }
    // 4. Gemini завгүй → Claude руу шилжинэ
    console.log("Gemini завгүй байна → Claude руу шилжиж байна...");
    return askClaude(prompt);
  }
}

// ── Gemini-ээс асуух (завгүй бол хүлээгээд дахин оролдоно) ──
async function askGemini(prompt: string) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json", // "зөвхөн JSON буцаа" гэж хэлнэ
          temperature: 0.2, // бага утга = тогтвортой, зохиомол багатай хариу
        },
      });
      console.log(`AI хариулсан: Gemini (${GEMINI_MODEL})`);
      return parseJSON(response.text || "");
    } catch (error) {
      // Завгүй биш алдаа эсвэл сүүлийн оролдлого бол алдааг дээш нь дамжуулна
      if (!isBusyError(error) || attempt === MAX_ATTEMPTS) {
        console.log(`Gemini алдаа (${attempt}-р оролдлого):`, String(error).slice(0, 200));
        throw error;
      }
      console.log(`Gemini завгүй (${attempt}-р оролдлого), ${attempt * 5} секунд хүлээнэ...`);
      await wait(attempt * 5000);
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
