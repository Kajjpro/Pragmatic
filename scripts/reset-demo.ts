// Демо төлөвийг сэргээнэ (питчийн өмнө, бэлтгэл бүрийн дараа). AI дуудахгүй.
//   DATABASE_URL=<prod> DEMO_CITIZEN_EMAIL=… npm run reset-demo
// Дэлгэрэнгүй: scripts/DEMO-RESET.md
import "dotenv/config";
import { resetDemo } from "../lib/demo-reset";
import { prisma } from "../lib/prisma";

async function main() {
  const host = (process.env.DATABASE_URL ?? "").replace(/^.*@/, "").replace(/\/.*$/, "");
  console.log(`Демо сэргээж байна → ${host || "(DATABASE_URL хоосон)"}\n`);

  const r = await resetDemo({ demoCitizenEmail: process.env.DEMO_CITIZEN_EMAIL });

  console.table({
    "Дахин нээсэн санал хураалт": r.voteEventsReopened,
    "Буцааж хассан таамгийн оноо": r.predictionPointsReverted,
    "Хариугүй болгосон бүлэг": r.groupsReopened,
    "Устгасан тэмдэг": r.cleared.badges,
    "Устгасан мэдэгдэл": r.cleared.notifications,
    "Устгасан таамаг": r.cleared.predictions,
    "Устгасан карт үзэлт": r.cleared.cardViews,
    "Устгасан хариулт": r.cleared.quizAnswers,
    "Устгасан туршилтын санал": r.cleared.extraComments,
  });
  console.log(`Демо иргэн: ${r.demoCitizen ?? "-"} (оноо 2, streak 0, тэмдэггүй)`);
  if (r.warnings.length) console.log(`\n⚠ ${r.warnings.join("\n⚠ ")}`);
  else console.log("\n✓ Демо бэлэн");
}

main()
  .catch((e) => {
    console.error("\nreset-demo амжилтгүй:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
