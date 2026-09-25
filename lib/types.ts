// Backend ↔ frontend гэрээ (Хариу v2) — CLAUDE.md-ийн "Data model" ба "API".
// Dev 3-ийн түр lib/types.ts-ийн нэр, талбарууд ЯГ хэвээр. Dev 1-ийн нэмсэн талбар бүр `?` (заавал биш),
// тиймээс lib/mock.ts-ийн объектууд өөрчлөлтгүй таарна.
// Огноо бүр JSON-оор ISO текст ("2026-09-25T10:00:00.000Z") болж ирнэ.

// ── Хуучин (v1) төрлүүд — хуулийн харьцуулалт, санал ──
export type {
  BillDetail,
  BillSummary,
  ClauseView,
  FilteredCommentView,
  GroupView,
  ReflectionValue as Reflection,
} from "./law/queries";
export type { ChangeType, FilterStatus, Stage, WordPart } from "./law/types";

import type { ReflectionValue } from "./law/queries";
import type { ChangeType, FilterStatus, WordPart } from "./law/types";

export type ApiError = { error: string }; // алдаа бүр ийм хэлбэртэй, монголоор

// ── Хэрэглэгчийн бүлэг: «Би хэн бэ?» ──
export const PERSONAS = ["STUDENT", "DRIVER", "WORKER", "PARENT", "ALL"] as const;
export type Persona = (typeof PERSONAS)[number];

export const personaLabels: Record<Persona, string> = {
  STUDENT: "Сурагч",
  DRIVER: "Жолооч",
  WORKER: "Ажил хийдэг",
  PARENT: "Эцэг эх",
  ALL: "Бүгд",
};

// ── ① Өнөөдрийн хууль — 60 секундийн карт ──
export type CardKind = "BILL" | "CHANGE"; // бүтэн төсөл | нэг заалтын өөрчлөлт

// Викторины асуулт. correctIndex, explanation-ийг ЭНД ХЭЗЭЭ Ч явуулахгүй.
export type QuizQuestionView = {
  id: string;
  question: string;
  options: string[]; // 3–4 сонголт
};

// GET /api/feed?persona=STUDENT|DRIVER|WORKER|PARENT|ALL → FeedCard[]
export type FeedCard = {
  id: string;
  kind: CardKind;
  emoji: string;
  hook: string; // ≤ 60 тэмдэгт
  before: string | null; // "Одоо"
  after: string | null; // "Болох нь"
  youMeaning: string; // "Чамд юу гэсэн үг вэ"
  personas: Persona[];
  sourceUrl: string;
  order: number;
  quiz: QuizQuestionView[];
  projectId?: string | null; // холбоотой төсөл → /bills/[projectId]
  clauseId?: string | null;
};

// POST /api/quiz/[id]/answer { chosenIndex } → QuizAnswerResult
// Нэвтрээгүй ч зөв хариуг харуулна (saved: false, оноо өгөхгүй).
export type QuizAnswerResult = {
  correct: boolean;
  correctIndex: number;
  explanation: string;
  pointsAwarded: number; // зөвхөн анхны оролдлого зөв бол 3
  saved?: boolean; // false = зочин, хадгалаагүй
  points?: number | null; // хэрэглэгчийн нийт оноо (зочинд null)
};

// POST /api/cards/[id]/view → CardViewResult (зочинд saved: false, алдаа биш)
export type CardViewResult = {
  saved: boolean;
  points: number | null;
  streak: number | null;
  pointsAwarded: number;
  newBadges: Badge[];
};

// ── ② Таамаг — санал хураалтын таамаглал ──
export type VoteEventStatus = "OPEN" | "REVEALED";

export const MAX_SUPPORT_GUESS = 126; // УИХ-ын гишүүдийн тоо

// GET /api/vote-events → VoteEvent[]  (OPEN ба REVEALED)
export type VoteEvent = {
  id: string;
  title: string;
  hook: string;
  isReplay: boolean; // Өмнө болсон санал хураалт бол ЗААВАЛ тэмдэглэнэ
  status: VoteEventStatus;
  closesAt: string | null;
  // Зөвхөн status === "REVEALED" үед бөглөгдөнө, бусад үед null.
  actualSupport: number | null;
  actualOppose: number | null;
  actualTotal: number | null;
  passed: boolean | null; // дэмжсэн нь олонх (support > oppose)
  projectId?: string | null;
  predictionCount?: number; // хэдэн хүн таамагласан
  revealedAt?: string | null;
};

export type Prediction = {
  voteEventId: string;
  willPass: boolean;
  supportGuess: number;
  points: number; // дүн гарахаас өмнө 0
  id?: string;
  createdAt?: string;
};

// POST /api/vote-events/[id]/predict { willPass, supportGuess: 0–126 } → 201 PredictResult
export type PredictResult = {
  prediction: Prediction;
  newBadges: Badge[]; // анхны таамаг бол FIRST_PREDICTION
};

// ── ⑥ Би хууль өөрчилсөн — тэмдэг ──
export const BADGE_TYPES = ["LAW_CHANGER", "STREAK_7", "FIRST_PREDICTION"] as const;
export type BadgeType = (typeof BADGE_TYPES)[number];

export const badgeLabels: Record<BadgeType, { title: string; emoji: string }> = {
  LAW_CHANGER: { title: "Хууль өөрчилсөн иргэн", emoji: "🏛️" },
  STREAK_7: { title: "7 хоног тасралтгүй", emoji: "🔥" },
  FIRST_PREDICTION: { title: "Анхны таамаг", emoji: "🎯" },
};

export type Badge = {
  id: string;
  type: BadgeType;
  createdAt: string;
  lawTitle?: string | null; // LAW_CHANGER үед
  clauseNumber?: string | null; // LAW_CHANGER үед
};

// GET /api/badges/[id] — нэвтрээгүй ч харна. Имэйл, бүтэн нэр хэзээ ч гарахгүй.
export type PublicBadge = {
  id: string;
  type: BadgeType;
  firstName: string;
  lawTitle: string | null;
  clauseNumber: string | null;
  date: string;
};

// ── GET /api/me ──
export type MyComment = {
  id: string;
  text: string;
  vote: "SUPPORT" | "OPPOSE" | "NEUTRAL";
  filterStatus: FilterStatus | null; // null = AI хараахан шүүгээгүй
  createdAt: string;
  clause: {
    id: string;
    number: string;
    changeType: ChangeType;
    oldText: string | null;
    newText: string | null;
    diff: WordPart[];
    billId: string;
    billTitle: string;
  };
  group: {
    id: string;
    title: string;
    summary: string | null;
    replyText: string | null; // ажилтан хариулаагүй бол null
    reflection: ReflectionValue;
    repliedAt: string | null;
  } | null;
};

export type NotificationView = {
  id: string;
  text: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export type MeData = {
  name: string | null;
  persona: Persona;
  points: number;
  streak: number; // өнөөдөр эсвэл өчигдөр идэвхгүй байсан бол 0
  badges: Badge[];
  // Доорх талбаруудыг API үргэлж буцаана
  id?: string;
  role?: "CITIZEN" | "STAFF";
  activeToday?: boolean;
  predictions?: (Prediction & { event: VoteEvent })[];
  comments?: MyComment[];
  notifications?: NotificationView[]; // сүүлийн 20
  quizAnswers?: { questionId: string; chosenIndex: number; correct: boolean }[];
  viewedCardIdsToday?: string[];
};

// POST /api/me/persona { persona } → { persona }
export type PersonaResult = { persona: Persona };
