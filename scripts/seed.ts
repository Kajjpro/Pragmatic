// Демо seed: 1 хууль, 4 заалт, 1 бүлэг + жишээ хариу.
// Ажиллуулах: npx tsx scripts/seed.ts
import { config as dotenv } from "dotenv";
dotenv({ path: ".env.local" });
dotenv();

async function main() {
  // env-г ачаалж дуусаад Prisma-г dynamic import хийнэ
  const { prisma } = await import("../lib/prisma");

  const existing = await prisma.project.findFirst({
    where: { title: { contains: "Хөдөлмөрийн" } },
  });
  if (existing) {
    console.log("Аль хэдийн seed хийсэн байна — алгасав:", existing.id);
    await prisma.$disconnect();
    return;
  }

  const project = await prisma.project.create({
    data: {
      title: "Хөдөлмөрийн тухай хууль (шинэчилсэн найруулга)",
      description:
        "Хөдөлмөрийн харилцаанд оролцогчдын эрх, үүргийг тодорхойлж, зайн ажил, гэрээт ажилтны хамгаалалтыг шинэчлэн зохицуулна.",
      projectNumber: "2026/034",
      typeTitle: "Шинэчилсэн найруулга",
      categoryTitle: "Нийгэм",
      stage: 2,
      publishedAt: new Date("2026-09-20"),
      allowComments: true,
      clauses: {
        create: [
          {
            number: "3.1",
            heading: "Ажил олгогчийн үүрэг",
            originalText:
              "Ажил олгогч нь ажилтны хөдөлмөрийн аюулгүй байдлыг хангах ажиллагаа явуулах үүрэгтэй байна.",
            plainText: "Ажлын байрны аюулгүй байдлыг ажил олгогч хангана.",
            order: 1,
          },
          {
            number: "14.2",
            heading: "Зайн ажил",
            originalText:
              "Ажил олгогч нь ажилтныг зайнаас ажиллуулахаар харилцан тохирсон тохиолдолд гэрээгээр цаг, багаж хэрэгсэл, харилцааны төлбөрийн зохицуулалтыг тодорхой заана.",
            plainText:
              "Гэрээсээ ажиллах бол цагийн болон интернэтийн зардлыг гэрээндээ бичнэ. Багаж хэрэгслээ ажил олгогч өгнө.",
            order: 2,
          },
          {
            number: "22.1",
            heading: "Эцэг эхийн чөлөө",
            originalText:
              "Ажилтан нь эх, эцэг эх болсон тохиолдолд нийт 12 сарын хугацаанд хамтын чөлөөг эдлэх эрхтэй бөгөөд уг чөлөөг эцэг эх хоорондоо хуваарилж болно.",
            plainText:
              "Хүүхэд төрсний дараа ээж, аав нийт 12 сар чөлөө авна. Хоёулаа хуваалцаж болно.",
            order: 3,
          },
          {
            number: "42.4",
            heading: "Хөдөлмөрийн маргаан",
            originalText:
              "Хөдөлмөрийн маргаан үүссэн тохиолдолд талууд онлайн платформыг ашиглан эвлэрлийн журмаар шийдвэрлэх боломжтой.",
            plainText:
              "Ажилтай холбоотой маргаан гарвал онлайн эвлэрүүлэх систем ашиглаж болно.",
            order: 4,
          },
        ],
      },
    },
    include: { clauses: true },
  });

  const cl142 = project.clauses.find((c) => c.number === "14.2");
  if (cl142) {
    const cluster = await prisma.cluster.create({
      data: {
        clauseId: cl142.id,
        label: "Интернэтийн зардлыг хэн төлөх нь тодорхойгүй",
        summary:
          "Иргэд «гэрээгээр биш, хуулиар тогтоох» саналыг хамгийн их хэлсэн.",
        status: "ANSWERED",
      },
    });
    await prisma.reply.create({
      data: {
        clusterId: cluster.id,
        aiDraft:
          "Ажил олгогч интернэтийн наад захын хэмжээг хариуцахаар 14.3-т тодотгол оруулахыг санал болгож байна.",
        finalText:
          "Ажил олгогч интернэтийн наад захын хэмжээг хариуцахаар 14.3-т тодотгол оруулав. Комиссын 09.24-ний хуралдаанаар шийдвэрлэсэн.",
        approvedAt: new Date("2026-09-24"),
      },
    });
    console.log(`Демо бүлэг + хариу үүслээ (заалт ${cl142.number}).`);
  }

  console.log(`✅ Seed амжилттай: ${project.title} (${project.id})`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
