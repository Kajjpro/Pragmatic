export type MeNotification = {
  id: string;
  read: boolean;
  createdAt: string;
  kind: "response" | "stage" | "evidence" | "vote";
  title: string;
  body: string;
  href: string;
};

export type MeParticipation = {
  id: string;
  lawId: string;
  lawTitle: string;
  clauseNumber: string;
  clusterLabel: string;
  stance: "support" | "oppose" | "neutral";
  count: number;
  response?: string;
  respondedAt?: string;
};

export const meFollowedLawIds = ["hodolmor-2026", "aguular-2026"];

export const meParticipation: MeParticipation[] = [
  {
    id: "p-1",
    lawId: "hodolmor-2026",
    lawTitle: "Хөдөлмөрийн тухай хууль (шинэчилсэн найруулга)",
    clauseNumber: "14 дүгээр зүйл",
    clusterLabel: "Интернэтийн зардлыг хэн төлөх нь тодорхойгүй",
    stance: "oppose",
    count: 2140,
    response:
      "Ажил олгогч интернэтийн наад захын хэмжээг хариуцахаар 14.3-т тодотголоо.",
    respondedAt: "2026-09-22",
  },
  {
    id: "p-2",
    lawId: "hodolmor-2026",
    lawTitle: "Хөдөлмөрийн тухай хууль (шинэчилсэн найруулга)",
    clauseNumber: "22 дугаар зүйл",
    clusterLabel: "Аавын чөлөөг заавал байхаар тогтоох",
    stance: "support",
    count: 3120,
  },
  {
    id: "p-3",
    lawId: "aguular-2026",
    lawTitle: "Агаарын тухай хууль (нэмэлт өөрчлөлт)",
    clauseNumber: "Үндсэн заалт",
    clusterLabel: "Хэмжигчийн өгөгдөл нээлттэй байх",
    stance: "support",
    count: 1450,
    response:
      "Байгаль орчны яамны портал руу 15 минут тутам өгөгдөл нийтлэхээр 7.1-т тусгав.",
    respondedAt: "2026-09-15",
  },
];

export const meNotifications: MeNotification[] = [
  {
    id: "n-1",
    read: false,
    createdAt: "2026-09-24 14:32",
    kind: "response",
    title: "Таны нэгдсэн бүлэгт комисс хариу өгөв",
    body: "«Интернэтийн зардлыг хэн төлөх нь тодорхойгүй» — 14.3 заалт тодотголтой.",
    href: "/laws/hodolmor-2026",
  },
  {
    id: "n-2",
    read: false,
    createdAt: "2026-09-24 09:11",
    kind: "stage",
    title: "Дагаж буй хууль шат ахилаа",
    body: "Хөдөлмөрийн тухай хууль — Хэлэлцүүлэг шатанд шилжлээ.",
    href: "/laws/hodolmor-2026",
  },
  {
    id: "n-3",
    read: true,
    createdAt: "2026-09-22 17:04",
    kind: "evidence",
    title: "Таны нотолгоо баталгаажлаа",
    body: "«Хэмжигчийн өгөгдөл нээлттэй байх» бүлэгт нэмэгдэв.",
    href: "/directives/dir-017",
  },
  {
    id: "n-4",
    read: true,
    createdAt: "2026-09-20 08:00",
    kind: "vote",
    title: "Санал хураалт зарлагдлаа",
    body: "Агаарын тухай хуулийн нэмэлт өөрчлөлт — тавдугаар долоо хоногт хураалт болно.",
    href: "/laws/aguular-2026",
  },
];
