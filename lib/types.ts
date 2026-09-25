// Backend ↔ frontend гэрээ (Хариу v2).
// Энд зөвхөн төрөл ба жижиг тогтмол байна — client компонентоос шууд import хийж болно.
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

// ── Тогтмолууд ──
export const PERSONAS = ["STUDENT", "DRIVER", "WORKER", "PARENT", "ALL"] as const;
export type Persona = (typeof PERSONAS)[number]; // Сурагч/оюутан | Жолооч | Ажилтан | Эцэг эх | Бүгд

export type VoteEventStatus = "DRAFT" | "OPEN" | "REVEALED";
export type BadgeType = "STREAK_7" | "FIRST_PREDICTION" | "LAW_CHANGER";

export const MAX_SUPPORT_GUESS = 126; // УИХ-ын гишүүдийн тоо

export type ApiError = { error: string }; // алдаа бүр ийм хэлбэртэй, монголоор

// ── GET /api/feed?persona=STUDENT|DRIVER|WORKER|PARENT|ALL ──
// Хариулт: FeedCard[]  (асуултын зөв хариу, тайлбар ЭНД БАЙХГҮЙ)
export type QuizQuestionView = {
  id: string;
  question: string;
  options: string[];
};

export type FeedCard = {
  id: string;
  slug: string;
  title: string;
  hook: string; // нэг өгүүлбэрийн "дэгээ"
  body: string; // 60 секундын тайлбар
  personas: Persona[];
  order: number;
  publishedAt: string;
  sourceUrl: string | null;
  billId: string | null; // холбоотой хуулийн төсөл байвал /bills/[id]
  questions: QuizQuestionView[];
};

// ── GET /api/vote-events ──
// Хариулт: VoteEventView[]  (зөвхөн OPEN ба REVEALED)
export type VoteResult = {
  support: number;
  oppose: number;
  total: number;
  passed: boolean; // дэмжсэн нь олонх (support > oppose)
};

export type VoteEventView = {
  id: string;
  agendaCode: string;
  title: string;
  hook: string;
  status: VoteEventStatus;
  isReplay: boolean; // санал хураалт аль хэдийн болсон, "дахин тоглуулж" байна
  voteDate: string | null;
  billId: string | null;
  predictionCount: number;
  result: VoteResult | null; // зөвхөн REVEALED үед
  revealedAt: string | null;
};

// ── Тэмдэг ──
export type BadgeView = {
  id: string;
  type: BadgeType;
  lawTitle: string | null; // LAW_CHANGER үед
  clauseNumber: string | null; // LAW_CHANGER үед
  createdAt: string;
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
export type MyPrediction = {
  id: string;
  willPass: boolean;
  supportGuess: number;
  pointsAwarded: number | null; // null = дүн хараахан гараагүй
  createdAt: string;
  event: VoteEventView;
};

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

export type MeView = {
  id: string;
  name: string | null;
  role: "CITIZEN" | "STAFF";
  persona: Persona | null; // null = хараахан сонгоогүй
  points: number;
  streak: number; // өнөөдөр эсвэл өчигдөр идэвхтэй байгаагүй бол 0
  activeToday: boolean;
  badges: BadgeView[];
  predictions: MyPrediction[];
  comments: MyComment[];
  notifications: NotificationView[]; // сүүлийн 20
  quizAnswers: { questionId: string; chosenIndex: number; correct: boolean }[];
  viewedCardIdsToday: string[];
};

// ── POST /api/me/persona { persona } → { persona } ──
export type PersonaResult = { persona: Persona };

// ── POST /api/cards/[id]/view → CardViewResult ──
// Нэвтрээгүй бол алдаа биш: saved = false, оноо null.
export type CardViewResult = {
  saved: boolean;
  points: number | null;
  streak: number | null;
  pointsAwarded: number;
  newBadges: BadgeView[];
};

// ── POST /api/quiz/[id]/answer { chosenIndex } → QuizAnswerResult ──
// Нэвтрээгүй ч зөв хариуг харуулна (saved = false, оноо өгөхгүй).
export type QuizAnswerResult = {
  saved: boolean;
  correct: boolean;
  correctIndex: number;
  explanation: string;
  pointsAwarded: number; // зөвхөн анхны оролдлого зөв бол 3
  points: number | null;
};

// ── POST /api/vote-events/[id]/predict { willPass, supportGuess } → PredictResult ──
export type PredictionView = {
  id: string;
  voteEventId: string;
  willPass: boolean;
  supportGuess: number;
  pointsAwarded: number | null;
  createdAt: string;
};

export type PredictResult = {
  prediction: PredictionView;
  newBadges: BadgeView[];
};
