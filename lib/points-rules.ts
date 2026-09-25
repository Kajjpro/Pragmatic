// Онооны дүрэм — нэг л газар. lib/points.ts (сервер) ба дэлгэц (streak цонх, таамаг) хоёулаа үүнийг уншина.
// Энд DB, сервер импорт БҮҮ нэм: хөтөч рүү ч орно.

export const POINTS = {
  CARD_VIEW: 1, // карт үзэх — өдөрт нэг картад нэг удаа
  QUIZ_CORRECT: 3, // асуултад анхны оролдлогоор зөв хариулах
  PREDICTION_PASS: 10, // батлагдах эсэхийг зөв таах
  RELEVANT_COMMENT: 2, // AI санал "хамааралтай" гэж үзсэн
  REFLECTED: 50, // санал хуульд тусгагдсан
} as const;

// Дэмжих гишүүдийн тоог таахад: зөрүү ≤ 3 → +10, ≤ 8 → +5, ≤ 15 → +2
export const SUPPORT_GUESS_POINTS = [
  { within: 3, points: 10 },
  { within: 8, points: 5 },
  { within: 15, points: 2 },
] as const;

export const STREAK_BADGE_DAYS = 7;

// Өдрийн уншлагын зорилго (зөвхөн дэлгэцийн зорилт — оноонд нөлөөгүй)
export const DAILY_CARD_GOAL = 3;
