// Зочин (нэвтрээгүй) хэрэглэгчийн явцыг төхөөрөмж дээр хадгална.
// Нэвтэрсэн үед Dev 1-ийн GET /api/me эрх мэдэлтэй болох ба энэ нь
// зөвхөн шууд харагдах тоо (optimistic) болж үлдэнэ.
//
// localStorage нь хаалттай горимд алдаа өгдөг тул бүгдийг try/catch-д оруулав.

import type { Persona } from "@/lib/types";

const KEY = "hariu.progress.v1";

export type Progress = {
  persona: Persona | null;
  points: number;
  streak: number;
  lastActiveDay: string | null; // "2026-09-26"
  viewedToday: string[]; // өнөөдөр үзсэн картын id-ууд
  answered: string[]; // хариулсан асуултын id-ууд (оноо давхар өгөхгүй)
  askedToSave: boolean; // "хадгалах уу?" хуудсыг нэг л удаа үзүүлнэ
};

const empty: Progress = {
  persona: null,
  points: 0,
  streak: 0,
  lastActiveDay: null,
  viewedToday: [],
  answered: [],
  askedToSave: false,
};

// Улаанбаатарын цагаар өнөөдрийн огноо
export function today(): string {
  return new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Ulaanbaatar",
  });
}

function yesterdayOf(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function readProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...empty };
    const p = { ...empty, ...(JSON.parse(raw) as Partial<Progress>) };
    // Өдөр солигдсон бол өнөөдрийн үзсэн жагсаалтыг цэвэрлэнэ
    if (p.lastActiveDay !== today()) p.viewedToday = [];
    return p;
  } catch {
    return { ...empty };
  }
}

export function writeProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Хаалттай горимд хадгалж чадахгүй — апп ажилласаар байна
  }
}

// Карт үзэхэд: өдөрт нэг удаа +1 оноо, шаардлагатай бол streak шинэчилнэ.
// Оноо нэмэгдсэн эсэхийг буцаана (PointsPop харуулах эсэх).
export function recordCardView(
  p: Progress,
  cardId: string,
): { next: Progress; gained: number; streakChanged: boolean } {
  if (p.viewedToday.includes(cardId)) {
    return { next: p, gained: 0, streakChanged: false };
  }

  const day = today();
  let streak = p.streak;
  let streakChanged = false;

  if (p.lastActiveDay !== day) {
    // Шинэ өдөр: өчигдөр идэвхтэй байсан бол +1, эс бөгөөс 1-ээс эхэлнэ
    streak = p.lastActiveDay === yesterdayOf(day) ? p.streak + 1 : 1;
    streakChanged = true;
  } else if (streak === 0) {
    streak = 1;
    streakChanged = true;
  }

  const next: Progress = {
    ...p,
    points: p.points + 1,
    streak,
    lastActiveDay: day,
    viewedToday: [...p.viewedToday, cardId],
  };
  writeProgress(next);
  return { next, gained: 1, streakChanged };
}

// Викторын зөв хариулт: асуулт тутамд нэг л удаа оноо өгнө.
export function recordQuizAnswer(
  p: Progress,
  questionId: string,
  points: number,
): { next: Progress; gained: number } {
  if (p.answered.includes(questionId)) return { next: p, gained: 0 };
  const next: Progress = {
    ...p,
    points: p.points + points,
    answered: [...p.answered, questionId],
  };
  writeProgress(next);
  return { next, gained: points };
}
