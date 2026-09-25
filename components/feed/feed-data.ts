// Фийдийн өгөгдөл татах давхарга.
// Dev 1-ийн API бэлэн болтол lib/mock.ts-ээс уншина.
// Маршрут байхгүй (404) бол ЧИМЭЭГҮЙ mock руу шилжинэ; бусад алдаа
// (500 гэх мэт) бол алдааны төлөв харуулахын тулд throw хийнэ.

import type { FeedCard, Persona, QuizAnswerResult } from "@/lib/types";
import { mockCards, mockQuizAnswers } from "@/lib/mock";

export type FeedSource = "api" | "mock";

function mockFeed(persona: Persona): FeedCard[] {
  const all = [...mockCards].sort((a, b) => a.order - b.order);
  if (persona === "ALL") return all;
  return all.filter((c) => c.personas.includes(persona));
}

export async function fetchFeed(
  persona: Persona,
): Promise<{ cards: FeedCard[]; source: FeedSource }> {
  try {
    const res = await fetch(`/api/feed?persona=${persona}`, {
      cache: "no-store",
    });
    if (res.status === 404) return { cards: mockFeed(persona), source: "mock" };
    if (!res.ok) throw new Error(`Фийд татаж чадсангүй (${res.status})`);
    const data = (await res.json()) as FeedCard[];
    return { cards: data, source: "api" };
  } catch (e) {
    // Маршрут огт байхгүй үед fetch өөрөө алдаа өгдөггүй тул энд зөвхөн
    // сүлжээний алдаа орно. Демо зогсохгүйн тулд mock руу шилжинэ.
    if (e instanceof TypeError) return { cards: mockFeed(persona), source: "mock" };
    throw e;
  }
}

// Карт үзсэнийг бүртгэнэ. API байхгүй бол чимээгүй өнгөрнө.
export async function postCardView(cardId: string): Promise<void> {
  try {
    await fetch(`/api/cards/${cardId}/view`, { method: "POST" });
  } catch {
    // Оноог одоогоор төхөөрөмж дээр тоолж байгаа тул алдааг үл тоомсорлоно
  }
}

// Викторын хариу. API байхгүй бол демо хариултыг ашиглана.
export async function postQuizAnswer(
  questionId: string,
  chosenIndex: number,
): Promise<QuizAnswerResult> {
  try {
    const res = await fetch(`/api/quiz/${questionId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chosenIndex }),
    });
    if (res.ok) return (await res.json()) as QuizAnswerResult;
  } catch {
    // доорх демо хариулт руу шилжинэ
  }
  const meta = mockQuizAnswers[questionId];
  const correct = meta?.correctIndex === chosenIndex;
  return {
    correct,
    correctIndex: meta?.correctIndex ?? -1,
    explanation: meta?.explanation ?? "",
    pointsAwarded: correct ? 3 : 0,
  };
}

// Нэвтэрсэн хэрэглэгчийн бүлгийг хадгална.
export async function postPersona(persona: Persona): Promise<void> {
  try {
    await fetch("/api/me/persona", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona }),
    });
  } catch {
    // Зочны хувьд localStorage-д хадгалагдсан хэвээр байна
  }
}
