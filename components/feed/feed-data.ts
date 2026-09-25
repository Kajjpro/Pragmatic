// Бодит API-тай харьцах давхарга (CLAUDE.md "API").
// lib/mock.ts-ийг ЭНД ИМПОРТЛОХГҮЙ — mock нь зөвхөн локал хөгжүүлэлтэд.
//
// Dev 1-ийн маршрутууд зочинд ээлтэй: нэвтрээгүй үед 401 биш,
// { saved: false } гэж буцаадаг тул урсгал тасрахгүй.

import type {
  CardViewResult,
  FeedCard,
  MeData,
  Persona,
  QuizAnswerResult,
  VoteEvent,
} from "@/lib/types";

// Сервер монголоор алдаа буцаадаг: { error: "..." }
async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    if (data && typeof data.error === "string") return data.error;
  } catch {
    // JSON биш бол доорх ерөнхий мессеж
  }
  return fallback;
}

// GET /api/feed?persona=... → FeedCard[]
export async function fetchFeed(persona: Persona): Promise<FeedCard[]> {
  const res = await fetch(`/api/feed?persona=${persona}`, { cache: "no-store" });
  if (!res.ok) throw new Error(await errorMessage(res, "Хуулиудыг татаж чадсангүй"));
  return (await res.json()) as FeedCard[];
}

// POST /api/cards/[id]/view → зочинд saved:false, нэвтэрсэнд оноо/streak
export async function postCardView(cardId: string): Promise<CardViewResult | null> {
  try {
    const res = await fetch(`/api/cards/${cardId}/view`, { method: "POST" });
    if (!res.ok) return null;
    return (await res.json()) as CardViewResult;
  } catch {
    // Үзсэнийг бүртгэж чадаагүй нь уншихад саад болохгүй
    return null;
  }
}

// POST /api/quiz/[id]/answer → зөв эсэх, зөв хариу, тайлбар
export async function postQuizAnswer(
  questionId: string,
  chosenIndex: number,
): Promise<QuizAnswerResult> {
  const res = await fetch(`/api/quiz/${questionId}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chosenIndex }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Хариуг шалгаж чадсангүй"));
  return (await res.json()) as QuizAnswerResult;
}

// POST /api/me/persona — зөвхөн нэвтэрсэн үед. Зочинд 401 ирэх нь хэвийн.
export async function postPersona(persona: Persona): Promise<void> {
  try {
    await fetch("/api/me/persona", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona }),
    });
  } catch {
    // Зочны сонголт localStorage-д хэвээр үлдэнэ
  }
}

// GET /api/me — нэвтрээгүй бол null (401)
export async function fetchMe(): Promise<MeData | null> {
  try {
    const res = await fetch("/api/me", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as MeData;
  } catch {
    return null;
  }
}

// GET /api/vote-events → VoteEvent[]
export async function fetchVoteEvents(): Promise<VoteEvent[]> {
  const res = await fetch("/api/vote-events", { cache: "no-store" });
  if (!res.ok) throw new Error(await errorMessage(res, "Санал хураалтыг татаж чадсангүй"));
  return (await res.json()) as VoteEvent[];
}

// POST /api/vote-events/[id]/predict — зөвхөн нэвтэрсэн үед
export async function postPrediction(
  eventId: string,
  willPass: boolean,
  supportGuess: number,
): Promise<void> {
  const res = await fetch(`/api/vote-events/${eventId}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ willPass, supportGuess }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Таамгийг хадгалж чадсангүй"));
}
