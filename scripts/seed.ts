// data/precomputed.json → DB. AI дуудахгүй, дахин ажиллуулж болно.
//   npm run seed                         (.env-ийн DATABASE_URL руу)
//   npm run seed -- --data=өөр/хавтас    (туршилтын өгөгдөл)
// .env: DEMO_CITIZEN_EMAIL, DEMO_CITIZEN_COMMENT (демо иргэний бодит санал), STAFF_EMAILS
import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../lib/prisma";
import { parseSeedData, seedDatabase } from "../lib/seed";

const dataDir = process.argv.find((a) => a.startsWith("--data="))?.split("=")[1] ?? "data";

async function main() {
  const file = join(dataDir, "precomputed.json");
  if (!existsSync(file)) throw new Error(`${file} алга — Dev 2-ийн scripts/precompute.ts үүнийг үүсгэнэ`);

  const r = await seedDatabase(parseSeedData(readFileSync(file, "utf8")), {
    dataDir,
    demoCitizenEmail: process.env.DEMO_CITIZEN_EMAIL?.trim() || undefined,
    demoCitizenComment: process.env.DEMO_CITIZEN_COMMENT?.trim() || undefined,
    staffEmails: (process.env.STAFF_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean),
  });

  console.log(`\nSeed → ${file}\n`);
  console.table({
    "Төсөл": r.bills,
    "Заалт": r.clauses,
    "Карт": r.cards,
    "Асуулт": r.questions,
    "Санал хураалт": r.voteEvents,
    "Санал": r.comments,
    "  үүнээс шүүгдсэн": r.filtered,
    "Бүлэг": r.groups,
  });
  console.log(`Демо иргэн: ${r.demoCitizen ?? "(DEMO_CITIZEN_EMAIL хоосон)"}`);
  console.log(`Ажилтан: ${r.staff.length ? r.staff.join(", ") : "(STAFF_EMAILS хоосон)"}`);
  if (r.warnings.length) console.log(`\n⚠ ${r.warnings.length} анхааруулга:\n  - ${r.warnings.join("\n  - ")}`);
}

main()
  .catch((e) => {
    console.error("\nseed амжилтгүй:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
