// LawForum-ын бүх идэвхтэй төслийг DB руу татна (AI дуудахгүй, дахин ажиллуулж болно).
//   npm run sync:projects          (.env-ийн DATABASE_URL, LAWFORUM_API_URL)
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { syncLawforumProjects } from "../lib/lawforum-sync";

async function main() {
  const r = await syncLawforumProjects();
  console.log("LawForum → DB");
  console.table({
    "LawForum-оос ирсэн": r.fetched,
    "Үүнээс идэвхтэй": r.active,
    "Шинээр нэмсэн": r.created,
    "Шинэчилсэн": r.updated,
    "Дэлгэрэнгүй авч чадаагүй": r.detailFailed,
  });
}

main()
  .catch((e) => {
    console.error("\nsync:projects амжилтгүй:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
