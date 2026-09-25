import "dotenv/config";
import { prisma } from "../lib/prisma";
import { seedFromFiles } from "../lib/law/seed";
import { STAGES, type Stage } from "../lib/law/types";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const value = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];

async function main() {
  const stage = value("stage");
  if (stage && !STAGES.includes(stage as Stage)) {
    throw new Error(`--stage must be one of ${STAGES.join(", ")}`);
  }

  const r = await seedFromFiles({
    dataDir: value("data"),
    replace: flag("replace"),
    live: flag("live"),
    stage: stage as Stage | undefined,
  });

  console.log(`AI results from: ${r.aiSource}`);
  console.log(`bill ${r.billId}: ${r.clauses} clauses, ${r.changed} changed, ${r.approved} approved`);
  if (r.needCheck.length) console.log(`⚠ check by hand (change could not be applied cleanly): ${r.needCheck.join(", ")}`);
  console.log(`comments: ${r.commentsSaved} saved${r.commentsSkipped ? `, ${r.commentsSkipped} skipped (unknown clause)` : ""}`);
  console.log(`${r.groups} groups, ${r.filtered} comments filtered out (kept, staff can restore)`);
}

main()
  .catch((e) => {
    console.error("\nseed failed:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
