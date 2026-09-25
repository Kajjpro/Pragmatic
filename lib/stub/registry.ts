export type RegistryStatus = "proposed" | "watching" | "removal";

export type RegistryItem = {
  id: string;
  code: string;
  title: string;
  status: RegistryStatus;
  proposer: string;
  submittedAt: string;
  sourceQuote: string;
  sourceRef: string;
  reason: string;
};

export const registryItems: RegistryItem[] = [
  {
    id: "reg-1",
    code: "HL-2026-042",
    title: "Зайн ажлын гэрээний загварыг ажил олгогчдод хүргэх",
    status: "proposed",
    proposer: "AI санамж — тайлан №rep-2026q3-hns",
    submittedAt: "2026-09-22",
    sourceQuote:
      "…гэрээний загварыг…ажил олгогч байгууллагуудад хүргэх ба 90% хамрагдалтыг хангасан байна.",
    sourceRef: "Хөдөлмөрийн тухай хууль 14.2",
    reason:
      "Иргэдийн 2,140 нотолгоо гэрээний загвар аваагүй гэдгийг харуулав. Хяналтад авах шаардлагатай.",
  },
  {
    id: "reg-2",
    code: "AG-2026-017",
    title: "Дулааны 4 станцын утаанд онлайн хэмжигч байрлуулах",
    status: "proposed",
    proposer: "AI санамж — тайлан №rep-2026q3-echu",
    submittedAt: "2026-09-15",
    sourceQuote:
      "…утаа гаргах цэг тус бүрд онлайн хэмжигч байрлуулж, өгөгдлийг…нээлттэй портал руу 15 минут тутам илгээнэ.",
    sourceRef: "Агаарын тухай хууль 7.1",
    reason:
      "Байгууллагын өөрийн үнэлгээ ба хэмжилтийн зөрүү 46 нэгж. Иргэдийн 940 нотолгоо.",
  },
  {
    id: "reg-3",
    code: "HL-2026-058",
    title: "Хөдөлмөрийн маргаан шийдвэрлэх онлайн платформ",
    status: "watching",
    proposer: "УИХ Тамгын газар",
    submittedAt: "2026-08-05",
    sourceQuote: "…6 аймагт 2026 оны 11 дүгээр сарын 15-ны дотор нэвтрүүлж…",
    sourceRef: "Хөдөлмөрийн тухай хууль 42.4",
    reason: "Одоо хугацаандаа хэрэгжиж байна — сар бүр эргэн харах.",
  },
  {
    id: "reg-4",
    code: "AG-2026-011",
    title: "Түүхий нүүрсний борлуулалтыг зөвшөөрөлтэй цэгээр хязгаарлах",
    status: "watching",
    proposer: "УИХ Тамгын газар",
    submittedAt: "2026-07-12",
    sourceQuote: "…зөвхөн зөвшөөрөлтэй 24 цэгээр…",
    sourceRef: "Агаарын тухай хууль 5.3",
    reason: "Хэрэгжилт баталгаажсан — хяналтаас гаргах санал ирэх сард.",
  },
  {
    id: "reg-5",
    code: "AG-2026-011",
    title: "Түүхий нүүрсний борлуулалт — хяналтаас хасах санал",
    status: "removal",
    proposer: "Байгаль орчны яам",
    submittedAt: "2026-09-24",
    sourceQuote: "…3 улирал дараалан 100% биелэлттэй…",
    sourceRef: "Байгууллагын Q3 тайлан",
    reason:
      "3 улирал дараалан бүрэн биелэсэн. Иргэдийн нотолгоо баталсан.",
  },
];
