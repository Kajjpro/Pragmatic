import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

export type ProjectSummary = {
  summary: string;
  keyPoints: string[];
  affected: string;
};

// lawforum-ын description HTML агуулж магадгүй тул цэвэр текст болгоно
export function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Үнэгүй түвшинд 429 (хэт олон хүсэлт) алдаа гарвал хүлээгээд дахин оролдоно
async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e) {
      const msg = String((e as Error).message ?? e);
      if (i >= tries - 1 || !/429|RESOURCE_EXHAUSTED|503/.test(msg)) throw e;
      await sleep(5000 * (i + 1));
    }
  }
}

export async function summarizeProject(
  title: string,
  rawText: string
): Promise<ProjectSummary> {
  const text = stripHtml(rawText).slice(0, 30000);

  const prompt = `Чи Монгол Улсын хуулийн төслийг энгийн иргэнд ойлгомжтой тайлбарладаг туслах.

Дүрэм:
- Зөвхөн доорх текстэд байгаа мэдээллийг ашигла. Текстэд байхгүй зүйл бүү нэм.
- Хуулийн мэргэжлийн хэллэгээс зайлсхий. Ахлах ангийн сурагч ойлгохоор бич.
- Улс төрийн үнэлгээ, өөрийн санал бүү өг. Төвийг сахи.
- Текст хэт богино эсвэл утгагүй бол summary-д "Төслийн дэлгэрэнгүй текст хангалтгүй байна." гэж бич.

Төслийн нэр: ${title}

Төслийн текст:
"""
${text}
"""`;

  const res = await withRetry(() =>
    ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "3-4 өгүүлбэрт энгийн тайлбар",
            },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Гол өөрчлөлтүүд, 3-5 ширхэг, тус бүр нэг өгүүлбэр",
            },
            affected: {
              type: Type.STRING,
              description: "Энэ хууль хэнд нөлөөлөх вэ, нэг өгүүлбэр",
            },
          },
          required: ["summary", "keyPoints", "affected"],
        },
      },
    })
  );

  const parsed = JSON.parse(res.text ?? "{}") as Partial<ProjectSummary>;
  if (!parsed.summary) throw new Error("Gemini хоосон хариу өгсөн");
  return {
    summary: parsed.summary,
    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
    affected: parsed.affected ?? "",
  };
}
