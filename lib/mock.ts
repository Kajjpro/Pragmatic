// Дэмо мок өгөгдөл — CLAUDE.md-ын хуваалцсан төрлүүдтэй яг таарсан.
// Dev 1-ийн /api/bills/[id] бэлэн болмогц энэ файлаас татах шаардлагагүй болно.
import { diffWords } from "diff";

export type Stage =
  | "DISCUSS_DECISION"
  | "FIRST_READING"
  | "FINAL_READING"
  | "FINAL_APPROVAL";

export type ChangeType = "ADDED" | "REMOVED" | "CHANGED" | "UNCHANGED";
export type Reflection = "PENDING" | "REFLECTED" | "NOT_REFLECTED";
export type WordPart = { value: string; added?: boolean; removed?: boolean };

export type BillSummary = {
  id: string;
  title: string;
  stage: Stage;
  changedCount: number;
  unapprovedCount: number;
  commentCount: number;
  unansweredGroupCount: number;
};

export type GroupView = {
  id: string;
  title: string;
  summary: string;
  commentCount: number;
  replyDraft: string | null;
  replyText: string | null;
  reflection: Reflection;
};

export type ClauseView = {
  id: string;
  number: string;
  oldText: string | null;
  newText: string | null;
  changeType: ChangeType;
  diff: WordPart[];
  sourceQuote: string | null;
  what: string | null;
  why: string | null;
  who: string | null;
  approved: boolean;
  groups: GroupView[];
};

export type BillDetail = {
  id: string;
  title: string;
  stage: Stage;
  reasonText: string | null;
  clauses: ClauseView[];
};

export const stageLabels: Record<Stage, string> = {
  DISCUSS_DECISION: "Хэлэлцэх эсэх",
  FIRST_READING: "Анхны хэлэлцүүлэг",
  FINAL_READING: "Эцсийн хэлэлцүүлэг",
  FINAL_APPROVAL: "Эцэслэн батлах",
};

function diff(oldText: string | null, newText: string | null): WordPart[] {
  const a = oldText ?? "";
  const b = newText ?? "";
  return diffWords(a, b).map((p) => ({
    value: p.value,
    added: p.added,
    removed: p.removed,
  }));
}

function makeClause(
  input: Omit<ClauseView, "diff" | "changeType"> & {
    changeType?: ChangeType;
  },
): ClauseView {
  const diffParts = diff(input.oldText, input.newText);
  let changeType: ChangeType = input.changeType ?? "UNCHANGED";
  if (!input.changeType) {
    if (!input.oldText && input.newText) changeType = "ADDED";
    else if (input.oldText && !input.newText) changeType = "REMOVED";
    else if (
      diffParts.some((p) => p.added) ||
      diffParts.some((p) => p.removed)
    )
      changeType = "CHANGED";
    else changeType = "UNCHANGED";
  }
  return { ...input, diff: diffParts, changeType };
}

export const MOCK_BILL_ID = "mock-hodolmor-2026";

export const mockBill: BillDetail = {
  id: MOCK_BILL_ID,
  title: "Хөдөлмөрийн тухай хуульд өөрчлөлт оруулах тухай",
  stage: "FIRST_READING",
  reasonText:
    "Хөдөлмөрийн харилцаанд зайн ажил, эцэг эхийн чөлөө, онлайн эвлэрлийг зохицуулах шаардлага гарсан тул холбогдох заалтуудад тодотгол оруулж байна.",
  clauses: [
    makeClause({
      id: "cl-3-1",
      number: "3.1",
      oldText:
        "Ажил олгогч нь ажилтны хөдөлмөрийн аюулгүй байдлыг хангах ажиллагаа явуулах хариуцлагатай байна.",
      newText:
        "Ажил олгогч нь ажилтны хөдөлмөрийн аюулгүй байдлыг хангах ажиллагаа явуулах хариуцлагатай байж болно.",
      sourceQuote:
        "3.1-д «хариуцлагатай байна» гэснийг «хариуцлагатай байж болно» гэж өөрчилсүгэй.",
      what: "«хариуцлагатай байна» → «хариуцлагатай байж болно» болов.",
      why: "Ажил олгогчийн үүрэг нь заавал биш, сонголт болов.",
      who: "Хувийн болон улсын секторын ажил олгогчид, тэдгээрийн ажилтнууд.",
      approved: false,
      groups: [],
    }),
    makeClause({
      id: "cl-14-2",
      number: "14.2",
      oldText:
        "Ажил олгогч нь ажилтныг зайнаас ажиллуулахаар харилцан тохирсон тохиолдолд гэрээгээр цаг, багаж хэрэгсэл, харилцааны төлбөрийн зохицуулалтыг тодорхой заана.",
      newText:
        "Ажил олгогч нь ажилтныг зайнаас ажиллуулахаар харилцан тохирсон тохиолдолд гэрээгээр цаг, багаж хэрэгсэл, харилцааны төлбөрийн зохицуулалтыг тодорхой заана. Интернэтийн наад захын хэмжээг ажил олгогч хариуцна.",
      sourceQuote:
        "14.2-ийн төгсгөлд «Интернэтийн наад захын хэмжээг ажил олгогч хариуцна.» гэсэн өгүүлбэр нэмсүгэй.",
      what: "Интернэтийн наад захын хэмжээг ажил олгогч хариуцна.",
      why: "Иргэдийн 2,140 санал: «Гэрээгээр биш, хуулиар тогтоох».",
      who: "Гэрээсээ ажилладаг бүх ажилтан.",
      approved: false,
      groups: [
        {
          id: "g-14-2-a",
          title: "Интернэтийн зардлыг хэн төлөх нь тодорхойгүй",
          summary:
            "«Гэрээгээр биш, хуулиар тогтоох» саналыг 2,140 иргэн дэмжсэн.",
          commentCount: 2140,
          replyDraft:
            "Ажил олгогч интернэтийн наад захын хэмжээг хариуцахаар 14.2-т өгүүлбэр нэмэв.",
          replyText:
            "Ажил олгогч интернэтийн наад захын хэмжээг хариуцахаар 14.2-т өгүүлбэр нэмэв. Комиссын 09.24-ний хуралдаанаар шийдвэрлэсэн.",
          reflection: "REFLECTED",
        },
        {
          id: "g-14-2-b",
          title: "Зайн ажлын хяналт хувь хүний нууцад халдана",
          summary:
            "Дэлгэц бичлэг, keystroke хяналтыг хориглох саналууд бүлэглэгдэв.",
          commentCount: 890,
          replyDraft:
            "14.5 шинэ заалтаар ажил олгогчийн хяналтын хэлбэрийг зохицуулах саналыг Хууль зүйн байнгын хороонд илгээв.",
          replyText: null,
          reflection: "PENDING",
        },
      ],
    }),
    makeClause({
      id: "cl-22-1",
      number: "22.1",
      oldText: null,
      newText:
        "Ажилтан нь эх, эцэг эх болсон тохиолдолд нийт 12 сарын хугацаанд хамтын чөлөөг эдлэх эрхтэй бөгөөд уг чөлөөг эцэг эх хоорондоо хуваарилж болно.",
      sourceQuote: "Хуульд «22.1. Эх, эцэг эхийн хамтын чөлөө» шинээр нэмсүгэй.",
      what:
        "Хүүхэд төрсний дараа эцэг эх нийт 12 сар чөлөө авах эрхтэй, хоёулаа хуваалцаж болно.",
      why: "Эмэгтэйчүүдийн ажил хөдөлмөрийн оролцоог хамгаалах бодлого.",
      who: "Хүүхэд төрөх ажилтан, тэдгээрийн ажил олгогч.",
      approved: true,
      groups: [
        {
          id: "g-22-1-a",
          title: "Аавын чөлөөг заавал байхаар тогтоох",
          summary: "Аавд 3 сарын заавал чөлөө хуваарилахыг санал болгосон.",
          commentCount: 3120,
          replyDraft:
            "Заавал бус, харин сонголттой хэвээр байхаар шийдэв.",
          replyText: null,
          reflection: "NOT_REFLECTED",
        },
      ],
    }),
    makeClause({
      id: "cl-42-4",
      number: "42.4",
      oldText:
        "Хөдөлмөрийн маргаан үүссэн тохиолдолд талууд эвлэрлийн журмаар шийдвэрлэнэ.",
      newText:
        "Хөдөлмөрийн маргаан үүссэн тохиолдолд талууд онлайн платформыг ашиглан эвлэрлийн журмаар шийдвэрлэх боломжтой.",
      sourceQuote:
        "42.4-т «онлайн платформыг ашиглан» гэсэн үг нэмсүгэй.",
      what: "Эвлэрэлд онлайн платформ ашиглах боломж нэмэгдэв.",
      why: "Хөдөө орон нутгийн хэрэглэгчдэд хүрэлцээ хангах.",
      who: "Ажилтай холбоотой маргаантай бүх иргэн.",
      approved: false,
      groups: [],
    }),
  ],
};

export const mockBillSummary: BillSummary = {
  id: mockBill.id,
  title: mockBill.title,
  stage: mockBill.stage,
  changedCount: mockBill.clauses.filter((c) => c.changeType !== "UNCHANGED")
    .length,
  unapprovedCount: mockBill.clauses.filter((c) => !c.approved).length,
  commentCount: mockBill.clauses.reduce(
    (a, c) => a + c.groups.reduce((b, g) => b + g.commentCount, 0),
    0,
  ),
  unansweredGroupCount: mockBill.clauses.reduce(
    (a, c) => a + c.groups.filter((g) => !g.replyText).length,
    0,
  ),
};

export function getMockBill(id: string): BillDetail | null {
  return id === MOCK_BILL_ID ? mockBill : null;
}
