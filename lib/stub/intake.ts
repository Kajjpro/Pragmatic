export type IntakeStage = "uploaded" | "parsing" | "matching" | "flagging" | "ready" | "error";

export type IntakeItem = {
  id: string;
  file: string;
  agency: string;
  period: string;
  size: string;
  submittedAt: string;
  stage: IntakeStage;
  message: string;
  reportId?: string;
};

export const intakeQueue: IntakeItem[] = [
  {
    id: "in-1",
    file: "HNS-Q3-2026-bielelt.docx",
    agency: "Хөдөлмөр, нийгмийн хамгааллын яам",
    period: "2026 III улирал",
    size: "1.8 MB",
    submittedAt: "2026-09-20 11:24",
    stage: "ready",
    message: "42 мөр таарлаа. Шалгагчид дамжуулсан.",
    reportId: "rep-2026q3-hns",
  },
  {
    id: "in-2",
    file: "BAZ-Q3-2026-bielelt.pdf",
    agency: "Байгаль орчны яам",
    period: "2026 III улирал",
    size: "3.4 MB",
    submittedAt: "2026-09-22 08:12",
    stage: "flagging",
    message: "AI үнэлгээ хийж, зөрүүтэй мөрүүдийг тодорсоор байна.",
    reportId: "rep-2026q3-baz",
  },
  {
    id: "in-3",
    file: "ECHU-Q3-2026-tuslay.docx",
    agency: "Эрчим хүчний яам",
    period: "2026 III улирал",
    size: "0.9 MB",
    submittedAt: "2026-09-15 15:00",
    stage: "ready",
    message: "22 мөр — нэг мөр гар шалгалттай.",
    reportId: "rep-2026q3-echu",
  },
  {
    id: "in-4",
    file: "SANH-2026-Q3-draft.pdf",
    agency: "Сангийн яам",
    period: "2026 III улирал",
    size: "5.2 MB",
    submittedAt: "2026-09-24 09:41",
    stage: "matching",
    message: "Тайлангийн мөрийг хуулийн зорилттой холбож байна…",
  },
  {
    id: "in-5",
    file: "BOL-2026-jiliyn.pdf",
    agency: "Боловсролын яам",
    period: "2026 III улирал",
    size: "6.8 MB",
    submittedAt: "2026-09-24 09:52",
    stage: "parsing",
    message: "Текст ялгаж, зурсан хүснэгтийг таньж байна…",
  },
  {
    id: "in-6",
    file: "SO-2026-tsagdaa.pdf",
    agency: "ХЗДХЯ",
    period: "2026 III улирал",
    size: "1.1 MB",
    submittedAt: "2026-09-23 16:12",
    stage: "error",
    message: "Файл гэмтэлтэй. Дахин илгээнэ үү.",
  },
];

export const stageMeta: Record<
  IntakeStage,
  { label: string; tone: "info" | "warn" | "good" | "danger" }
> = {
  uploaded: { label: "Хүлээн авсан", tone: "info" },
  parsing: { label: "Текст ялгаж буй", tone: "info" },
  matching: { label: "Зорилт холбож буй", tone: "info" },
  flagging: { label: "AI үнэлж буй", tone: "warn" },
  ready: { label: "Шалгахад бэлэн", tone: "good" },
  error: { label: "Алдаа", tone: "danger" },
};
