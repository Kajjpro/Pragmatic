// data/comments.json (гараар бичсэн иргэдийн санал) → AI шүүх → бүлэглэх → хариуны ноорог
// → data/precomputed.json-ы "comments", "groups" талбарыг шинэчилнэ. Бусад талбарыг хөндөхгүй.
//
//   npx tsx --env-file=.env scripts/precompute-comments.ts
//   npx tsx --env-file=.env scripts/precompute-comments.ts --stub   (AI дуудахгүй, туршилтад)
//
// scripts/precompute.ts бүх зүйлийг (карт, асуулт, санал хураалт) дахин бүтээдэг тул
// зөвхөн саналыг шинэчлэхэд энэ скриптийг ажиллуулна. Дараа нь: npm run seed
import { readFileSync, writeFileSync } from "node:fs";
import { filterComments, groupComments } from "../lib/ai/comments";
import { writeReply } from "../lib/ai/reply";
import { parseSeedData, type SeedData } from "../lib/seed";

type RawComment = { clause: string; name: string; vote: string; text: string };

const PAUSE_MS = 1500; // AI-г дараалан дуудахад бага зэрэг хүлээнэ (429-ээс сэргийлнэ)
const pause = () => new Promise((resolve) => setTimeout(resolve, PAUSE_MS));

// Демо иргэний санал (DEMO_CITIZEN_COMMENT) ямар бүлэгт нэгдэхийг эндээс шийднэ:
// энэ түлхүүртэй санал орсон бүлэг нь демод "Тусгасан" дарах бүлэг болно.
const DEMO_GROUP_ANCHOR = "c1";

async function main() {
  if (process.argv.includes("--stub")) process.env.AI_STUB = "true";

  const data: SeedData = parseSeedData(readFileSync("data/precomputed.json", "utf8"));
  const raw: RawComment[] = JSON.parse(readFileSync("data/comments.json", "utf8"));

  // 1. Харьцуулалттай (демо) төслийн заалтын текстийг олно — саналууд түүний талаар
  const demoBill = data.bills.find((b) => b.comparison && b.comparison.length > 0);
  if (!demoBill?.comparison) throw new Error("data/precomputed.json-д харьцуулалттай төсөл алга");
  const clauseText = new Map(
    demoBill.comparison.map((c) => [c.number, c.newText ?? c.oldText ?? ""]),
  );

  // 2. Санал бүрт тогтмол түлхүүр: c1, c2, ...
  const withKeys = raw.map((c, index) => ({ ...c, key: `c${index + 1}` }));

  const comments: SeedData["comments"] = [];
  const groups: SeedData["groups"] = [];

  // 3. Заалт тус бүрээр: шүүх → бүлэглэх → ноорог хариу
  for (const number of [...new Set(withKeys.map((c) => c.clause))]) {
    const text = clauseText.get(number) ?? "";
    const mine = withKeys.filter((c) => c.clause === number);
    console.log(`\n── ${number} дугаар заалт: ${mine.length} санал`);
    if (text === "") {
      console.log("   ⚠ ийм заалт харьцуулалтад алга — алгаслаа");
      continue;
    }

    // Шүүх (юу ч устгахгүй, зөвхөн шошго)
    const labels = await filterComments(text, mine.map((c) => ({ id: c.key, text: c.text })));
    const labelOf = (key: string) => labels.find((l) => l.id === key) ?? null;
    for (const c of mine) {
      const label = labelOf(c.key);
      comments.push({
        key: c.key,
        clauseNumber: number,
        name: c.name,
        vote: c.vote,
        text: c.text,
        filterStatus: label ? label.status : "RELEVANT",
        filterReason: label ? label.reason : "",
      });
      if (label && label.status !== "RELEVANT") console.log(`   ✗ ${c.key} ${label.status}: ${label.reason}`);
    }

    // Бүлэглэх — ЗӨВХӨН хамааралтай санал
    const relevant = mine.filter((c) => (labelOf(c.key)?.status ?? "RELEVANT") === "RELEVANT");
    console.log(`   ${relevant.length} хамааралтай, ${mine.length - relevant.length} шүүгдсэн`);
    if (relevant.length === 0) continue;

    await pause();
    const made = await groupComments(text, relevant.map((c) => ({ id: c.key, text: c.text })));

    // Бүлэг бүрт ажилтны хариуны ноорог
    for (const g of made) {
      const inGroup = relevant.filter((c) => g.commentIds.includes(c.key));
      if (inGroup.length === 0) continue;
      await pause();
      const replyDraft = await writeReply(text, {
        title: g.title,
        summary: g.summary,
        examples: inGroup.slice(0, 3).map((c) => c.text),
      });
      groups.push({
        key: `g${groups.length + 1}`,
        clauseNumber: number,
        title: g.title,
        summary: g.summary,
        commentKeys: inGroup.map((c) => c.key),
        replyDraft,
        demoReflectable: false,
      });
      console.log(`   ✓ «${g.title}» (${inGroup.length} санал)${replyDraft ? "" : " — ноорог хариу гарсангүй"}`);
    }
  }

  // 4. Демод "Тусгасан" дарах бүлэг: DEMO_GROUP_ANCHOR санал орсон бүлэг (эсвэл хамгийн олон саналтай)
  const anchored = groups.find((g) => g.replyDraft !== "" && g.commentKeys.includes(DEMO_GROUP_ANCHOR));
  const biggest = groups
    .filter((g) => g.replyDraft !== "")
    .sort((a, b) => b.commentKeys.length - a.commentKeys.length)[0];
  const target = anchored ?? biggest;
  if (target) target.demoReflectable = true;

  // 5. Файлыг шинэчилнэ — зөвхөн санал, бүлгийг
  writeFileSync(
    "data/precomputed.json",
    `${JSON.stringify({ ...data, comments, groups }, null, 2)}\n`,
    "utf8",
  );

  console.log(
    `\ndata/precomputed.json шинэчлэгдлээ: ${comments.length} санал ` +
      `(${comments.filter((c) => c.filterStatus !== "RELEVANT").length} шүүгдсэн), ${groups.length} бүлэг`,
  );
  console.log(`Демод "Тусгасан" дарах бүлэг: ${target ? `${target.key} «${target.title}»` : "(алга)"}`);
  console.log("Дараа нь: npm run seed");
}

main().catch((e) => {
  console.error("\nprecompute-comments амжилтгүй:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
