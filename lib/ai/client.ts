// lib/ai/client.ts
// Бүх AI функц Gemini-тэй ЭНЭ файлаар дамжиж ярина.

import { GoogleGenAI } from "@google/genai";

// 1. Gemini-тэй холбогдох. Түлхүүр ба загварын нэрийг .env-ээс уншина.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

// 2. Хэдэн миллисекунд хүлээх жижиг туслах функц
function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 3. Gemini руу prompt илгээж, JSON хариу авах
//    Gemini завгүй (503) эсвэл лимит хэтэрсэн (429) үед хүлээгээд дахин оролдоно. Хамгийн ихдээ 5 удаа.
//    Хүлээх хугацаа удаа бүр уртасна: 5, 10, 15, 20 секунд.
//    Бусад алдаа (буруу түлхүүр гэх мэт) дахин оролдоод ч засагдахгүй тул шууд дээш дамжуулна.
const MAX_ATTEMPTS = 5;

export async function askGeminiJSON(prompt: string) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json", // "зөвхөн JSON буцаа" гэж хэлнэ
          temperature: 0.2, // бага утга = тогтвортой, зохиомол багатай хариу
        },
      });

      const text = response.text || "{}";

      // Текстийг JavaScript объект болгоно.
      // JSON эвдэрхий байвал хоосон объект {} буцаана → функцууд "буруу хэлбэр" гэж үзээд хоосон үр дүн өгнө.
      try {
        return JSON.parse(text);
      } catch {
        console.log("Gemini эвдэрхий JSON буцаалаа:", text.slice(0, 200));
        return {};
      }
    } catch (error) {
      const message = String(error);
      const isBusy = message.includes("429") || message.includes("503");

      // Завгүй биш алдаа эсвэл сүүлийн оролдлого бол алдааг дээш нь дамжуулна
      if (!isBusy || attempt === MAX_ATTEMPTS) {
        console.log(`Gemini алдаа (${attempt}-р оролдлого):`, message);
        throw error;
      }

      console.log(`Gemini завгүй байна (${attempt}-р оролдлого), ${attempt * 5} секунд хүлээгээд дахин оролдоно...`);
      await wait(attempt * 5000);
    }
  }
  throw new Error("Gemini хариу өгсөнгүй");
}
