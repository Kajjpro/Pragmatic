// Бэлтгэлийн үеэр багийн ажилтны бүртгэлээр бичсэн туршилтын саналыг (жишээ нь "csssdsdsdsd") устгана.
//   npx tsx --env-file=.env scripts/clean-test-comments.ts          — зөвхөн харуулна
//   npx tsx --env-file=.env scripts/clean-test-comments.ts --delete — устгана
//
// ДҮРЭМ: иргэний (CITIZEN) саналыг ХЭЗЭЭ Ч устгахгүй — AI ч, ажилтан ч зөвхөн шошго тавина.
// Тиймээс энэ скрипт зөвхөн дараах хоёр нөхцөлийг ХОЁУЛАНГ нь хангасан мөрийг устгана:
//   1) ажилтан (STAFF) бүртгэлээр бичигдсэн, 2) seed-ийн демо санал биш (id нь "seed-"-ээр эхлэхгүй).
import { prisma } from "../lib/prisma";

async function main() {
  const doDelete = process.argv.includes("--delete");

  const rows = await prisma.comment.findMany({
    where: { user: { role: "STAFF" }, NOT: { id: { startsWith: "seed-" } } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      createdAt: true,
      user: { select: { email: true } },
      clause: { select: { number: true, project: { select: { title: true } } } },
    },
  });

  if (rows.length === 0) {
    console.log("Ажилтны бүртгэлээр бичсэн туршилтын санал алга — цэвэрлэх зүйлгүй.");
    return;
  }

  console.log(`${rows.length} туршилтын санал:`);
  for (const c of rows) {
    console.log(
      `  ${c.id}  ${c.clause.number}-р заалт  ${c.user?.email ?? "-"}  ` +
        `${c.createdAt.toISOString().slice(0, 10)}  «${c.body.slice(0, 60)}»  ${c.clause.project.title.slice(0, 40)}`,
    );
  }

  if (!doDelete) {
    console.log("\nУстгахын тулд --delete нэмж ажиллуулна уу.");
    return;
  }

  const { count } = await prisma.comment.deleteMany({ where: { id: { in: rows.map((c) => c.id) } } });
  console.log(`\n✓ ${count} туршилтын санал устгав.`);
}

main()
  .catch((e) => {
    console.error("\nclean-test-comments амжилтгүй:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
