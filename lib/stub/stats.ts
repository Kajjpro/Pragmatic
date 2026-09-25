export type ImpactStat = {
  label: string;
  value: string;
  hint: string;
  tone: "danger" | "warn" | "good" | "info";
};

export const impactStats: ImpactStat[] = [
  {
    label: "Одоогийн байдлаар цаасан тайлан",
    value: "93.9%",
    hint: "Хэвлэсэн PDF/скан хэлбэрээр ирдэг — уншиж чадах хэрэглэгч 0",
    tone: "danger",
  },
  {
    label: "AI-аар боловсруулсан мөр",
    value: "12,480",
    hint: "Сүүлийн 90 хоногт байгууллагын тайлангаас",
    tone: "info",
  },
  {
    label: "Иргэдийн санал бүлэглэсэн",
    value: "28,482",
    hint: "142 бүлэгт агуулгаар нь ангилав",
    tone: "info",
  },
  {
    label: "Ажилтны хэмнэсэн цаг",
    value: "624 цаг",
    hint: "Тайлан бүрд дунджаар 42 минут → 4 минут",
    tone: "good",
  },
  {
    label: "Хариу өгсөн зорилт",
    value: "38 / 42",
    hint: "Иргэдийн бүлгэд комиссын хариу өгсөн харьцаа",
    tone: "good",
  },
  {
    label: "Хугацаандаа зорилт",
    value: "71%",
    hint: "Хугацаанаас хоцорсон 8 зорилт улаан флагтай",
    tone: "warn",
  },
];

export type TimelinePoint = {
  month: string;
  opinions: number;
  responses: number;
};

export const engagementTimeline: TimelinePoint[] = [
  { month: "3", opinions: 1240, responses: 320 },
  { month: "4", opinions: 3410, responses: 890 },
  { month: "5", opinions: 5620, responses: 1450 },
  { month: "6", opinions: 8130, responses: 2280 },
  { month: "7", opinions: 12480, responses: 4020 },
  { month: "8", opinions: 19240, responses: 6810 },
  { month: "9", opinions: 28482, responses: 11540 },
];
