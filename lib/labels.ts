// Монгол шошгууд — бүх дэлгэц ижил үг хэрэглэхийн тулд нэг файлд байрлуулав.
import type { ReflectionValue } from "@/lib/law/queries";
import type { ChangeType, FilterStatus, Stage } from "@/lib/law/types";
import type { BadgeType, Persona } from "@/lib/types";

// Хуулийн төслийн 4 үе шат — дарааллаараа
export const stageOrder: Stage[] = [
  "DISCUSS_DECISION",
  "FIRST_READING",
  "FINAL_READING",
  "FINAL_APPROVAL",
];

export const stageLabels: Record<Stage, string> = {
  DISCUSS_DECISION: "Хэлэлцэх эсэх",
  FIRST_READING: "Анхны хэлэлцүүлэг",
  FINAL_READING: "Эцсийн хэлэлцүүлэг",
  FINAL_APPROVAL: "Эцэслэн батлах",
};

// Иргэд санал өгөх үе шатууд
export const commentStages: Stage[] = ["FIRST_READING", "FINAL_READING"];

export const changeTypeLabels: Record<ChangeType, string> = {
  ADDED: "Нэмсэн",
  REMOVED: "Хассан",
  CHANGED: "Өөрчилсөн",
  UNCHANGED: "Өөрчлөөгүй",
};

export const reflectionLabels: Record<ReflectionValue, string> = {
  REFLECTED: "Тусгасан",
  NOT_REFLECTED: "Тусгаагүй",
  PENDING: "Хүлээгдэж буй",
};

// AI саналыг шүүхдээ тавьсан шошго
export const filterStatusLabels: Record<FilterStatus, string> = {
  RELEVANT: "Хамааралтай",
  OFF_TOPIC: "Сэдвээс гадуур",
  ABUSIVE: "Утгагүй/доромжилсон",
  DUPLICATE: "Давхардсан",
};

// Хэрэглэгчийн төрөл (карт шүүх)
export const personaLabels: Record<Persona, string> = {
  STUDENT: "Сурагч, оюутан",
  DRIVER: "Жолооч",
  WORKER: "Ажил эрхлэгч",
  PARENT: "Эцэг эх",
  ALL: "Бүгд",
};

export const badgeLabels: Record<BadgeType, string> = {
  STREAK_7: "7 хоног дараалан",
  FIRST_PREDICTION: "Анхны таамаг",
  LAW_CHANGER: "Хууль өөрчилсөн иргэн",
};
