// lib/ai/client.ts
// Бүх AI функц AI-тай ЭНЭ файлаар дамжиж ярина.
// Дараалал: GEMINI_MODEL_STRONG → GEMINI_MODEL → GEMINI_FALLBACK_MODELS → Claude (түлхүүр байвал).
// Загвар 503/429/403/404 алдаа өгвөл ХҮЛЭЭХГҮЙГЭЭР шууд дараагийн загвар руу шилжинэ.
//
// .env тохиргоо:
//   AI_PROVIDER=gemini   (анхдагч) дээрх дарааллаар
//   AI_PROVIDER=claude   Gemini-г алгасаад шууд Claude
//   GEMINI_API_KEY
//   GEMINI_MODEL_STRONG          хамгийн түрүүнд оролдох хүчтэй загвар (заавал биш)
//   GEMINI_MODEL                 үндсэн загвар (анхдагч "gemini-3.5-flash-lite")
//   GEMINI_FALLBACK_MODELS       нөөц загварууд, таслалаар: "gemini-3.1-pro-preview,gemini-3.6-flash"
//   ANTHROPIC_API_KEY, ANTHROPIC_MODEL (анхдагч "claude-sonnet-5") — заавал биш
//
// Аль загвар хэрэглэж болохыг шалгах: npx tsx --env-file=.env scripts/list-models.ts

import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";

// 1. Claude-ийн загварын нэр
const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

// 2. Gemini-тэй холбогдох — анх хэрэгтэй үед л үүсгэнэ (build үед түлхүүргүй анхааруулга гаргахгүй)
let gemini: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  gemini ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return gemini;
}

// Эдгээр алдааны кодоор дараагийн загвар руу шууд шилжинэ:
//   503 = ачаалалтай, 429 = лимит хэтэрсэн, 403 = энэ түлхүүрт эрх алга, 404 = ийм загвар алга
const SKIP_CODES = [503, 429, 403, 404];

// Энэ ажиллагааны үед хариулсан загваруудын нэр (scripts/precompute.ts "model" талбарт бичнэ)
export const modelsUsed: string[] = [];

function rememberModel(name: string) {
  if (!modelsUsed.includes(name)) {
    modelsUsed.push(name);
  }
}

// ── ГОЛ ФУНКЦ: prompt илгээж, JSON хариу авна ──
// Нэр нь "askGeminiJSON" хэвээр (бусад файлууд үүнийг дууддаг), гэхдээ Claude ч хариулж болно.
// temperature: бага (0.2) = тогтвортой; бага зэрэг өндөр (0.6) = илүү сонирхолтой үг сонголт.
export async function askGeminiJSON(prompt: string, temperature = 0.2) {
  // 1. AI_PROVIDER=claude бол Gemini-г огт дуудахгүй
  if (process.env.AI_PROVIDER === "claude") {
    return askClaude(prompt);
  }

  // 2. Gemini загваруудыг дарааллаар нь оролдоно
  for (const model of getGeminiModels()) {
    try {
      return await askGemini(prompt, model, temperature);
    } catch (error) {
      const code = getErrorCode(error);
      // Жагсаалтад байхгүй алдаа (буруу түлхүүр, сүлжээ гэх мэт) бол шууд дээш дамжуулна
      if (!SKIP_CODES.includes(code)) {
        console.log(`${model} алдаа:`, String(error).slice(0, 200));
        throw error;
      }
      console.log(`${model} → ${code} алдаа, дараагийн загвар руу шилжиж байна...`);
    }
  }

  // 3. Бүх Gemini загвар ажилласангүй → Claude руу шилжинэ
  console.log("Бүх Gemini загвар ажилласангүй → Claude руу шилжиж байна...");
  return askClaude(prompt);
}

// Gemini загваруудын дараалал: хүчтэй → үндсэн → нөөц. Давхардсан, хоосон нэрийг алгасна.
// scripts/list-models.ts ч энэ жагсаалтыг хэвлэдэг.
export function getGeminiModels(): string[] {
  const names: string[] = [
    process.env.GEMINI_MODEL_STRONG || "",
    process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
    ...(process.env.GEMINI_FALLBACK_MODELS || "").split(","),
  ];

  const models: string[] = [];
  for (const name of names) {
    const cleanName = name.trim();
    if (cleanName !== "" && !models.includes(cleanName)) {
      models.push(cleanName);
    }
  }
  return models;
}

// ── Нэг Gemini загвараас НЭГ удаа асуух (хүлээхгүй, дахин оролдохгүй) ──
async function askGemini(prompt: string, model: string, temperature: number) {
  const response = await getGemini().models.generateContent({
    model: model,
    contents: prompt,
    config: {
      responseMimeType: "application/json", // "зөвхөн JSON буцаа" гэж хэлнэ
      temperature: temperature,
    },
  });
  console.log(`AI хариулсан: Gemini (${model})`);
  rememberModel(model);
  return parseJSON(response.text || "");
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
  rememberModel(CLAUDE_MODEL);
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

// Алдааны HTTP кодыг олно (503, 429 гэх мэт). Олдохгүй бол 0.
export function getErrorCode(error: unknown): number {
  // 1. @google/genai-ийн алдаа "status" талбарт кодоо хадгалдаг
  if (error && typeof error === "object" && "status" in error && typeof error.status === "number") {
    return error.status;
  }
  // 2. Үгүй бол алдааны текстээс хайна
  const match = String(error).match(/\b(403|404|429|503)\b/);
  if (match) {
    return Number(match[1]);
  }
  return 0;
}
