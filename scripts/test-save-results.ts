// scripts/test-save-results.ts
// Демо өдөр AI-аас хамаарахгүйн тулд бүх AI хариуг НЭГ удаа асууж data/results.json-д хадгална.
// Дараа нь `npm run seed -- --replace` (--live-гүй) AI огт дуудахгүйгээр яг ижил төслийг үүсгэнэ.
//
// Ажиллуулах: AI_CALL_DELAY_MS=1500 npx tsx --env-file=.env scripts/test-save-results.ts
//             (өөр хавтас: --data=хавтас)
//
// Дараалал нь lib/law/pipeline.ts ба lib/law/grouping.ts-тэй ЯГ адил:
//   readAmendment → applyChanges → өөрчлөгдсөн заалт бүрт explainChange
//   → заалт бүрийн саналыг filterComments → RELEVANT-ийг groupComments → бүлэг бүрт writeReply

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ai } from "../lib/law/ai";
import { applyChanges } from "../lib/law/apply";
import type { Results } from "../lib/law/replay";
import { splitIntoClauses } from "../lib/law/split";
import type { Explanation, FilterStatus } from "../lib/law/types";

const args = process.argv.slice(2);
const dir = args.find((a) => a.startsWith("--data="))?.split("=")[1] ?? "data";
const path = (name: string) => join(dir, name);
const readOpt = (name: string) => (existsSync(path(name)) ? readFileSync(path(name), "utf8") : null);

// AI-г хэт олон удаа дараалан дуудахгүйн тулд завсар авна (429 алдаанаас сэргийлнэ)
const delay = Number(process.env.AI_CALL_DELAY_MS ?? 0) || 0;
let firstCall = true;
async function pause() {
  if (!firstCall && delay) await new Promise((r) => setTimeout(r, delay));
  firstCall = false;
}

const FILTER_STATUSES: FilterStatus[] = ["RELEVANT", "OFF_TOPIC", "ABUSIVE", "DUPLICATE"];
const cleanNumber = (n: unknown) => String(n).trim().replace(/\.+$/, "");

type CommentItem = { clause: unknown; text?: unknown };

async function main() {
  // 1. Файлуудыг уншина
  const law = readOpt("law.txt");
  const bill = readOpt("bill.txt");
  if (!law || !bill) throw new Error(`${path("law.txt")} болон ${path("bill.txt")} хэрэгтэй`);
  const reason = readOpt("reason.txt") ?? "";

  // 2. Төслийг AI-аар уншуулж, хуульд хэрэглэнэ
  console.log("readAmendment...");
  const changes = await ai.readAmendment(bill);
  const clauses = applyChanges(splitIntoClauses(law), changes);
  const broken = clauses.filter((c) => c.applyError).map((c) => c.number);
  console.log(`  ${changes.length} өөрчлөлт, ${clauses.filter((c) => c.changeType !== "UNCHANGED").length} заалт өөрчлөгдөнө`);
  if (broken.length) console.log(`  ⚠ гараар шалгах (хэрэглэж чадсангүй): ${broken.join(", ")}`);

  // 3. Өөрчлөгдсөн заалт бүрийг тайлбарлана
  const explanations: Record<string, Explanation> = {};
  for (const c of clauses) {
    if (c.changeType === "UNCHANGED") continue;
    try {
      await pause();
      explanations[c.number] = await ai.explainChange(c.oldText, c.newText, reason, c.number);
      console.log(`  explainChange ${c.number} ✓`);
    } catch (err) {
      console.error(`  explainChange ${c.number} амжилтгүй:`, err);
    }
  }

  const results: Results = { changes, explanations, filter: [], groups: [] };

  // 4. Саналуудыг заалтаар нь ангилна. id = comments.json дахь байрлал (seed ч мөн адил тоолно)
  const raw = readOpt("comments.json");
  const items: CommentItem[] = raw ? JSON.parse(raw) : [];
  const byClause = new Map<string, { id: string; text: string }[]>();
  items.forEach((item, index) => {
    const text = typeof item.text === "string" ? item.text.trim() : "";
    const number = cleanNumber(item.clause);
    if (!text || !clauses.some((c) => c.number === number)) return; // seed ч алгасна
    const list = byClause.get(number) ?? [];
    list.push({ id: String(index), text });
    byClause.set(number, list);
  });

  // 5. Заалт бүрийн саналыг шүүж, бүлэглэж, хариуны төсөл бичнэ
  for (const clause of clauses) {
    const comments = byClause.get(clause.number);
    if (!comments) continue;
    const clauseText = clause.newText ?? clause.oldText ?? "";

    // 5.1 Шүүх: хамааралгүйг шошголно (устгахгүй)
    await pause();
    const verdicts = await ai.filterComments(clauseText, comments);
    const verdictById = new Map(verdicts.map((v) => [v.id, v]));
    const relevant: { id: string; text: string }[] = [];
    for (const c of comments) {
      const v = verdictById.get(c.id);
      const status = v && FILTER_STATUSES.includes(v.status) ? v.status : "RELEVANT";
      results.filter!.push({ comment: Number(c.id), status, reason: v?.reason ?? "" });
      if (status === "RELEVANT") relevant.push(c);
    }
    if (relevant.length === 0) continue;

    // 5.2 Бүлэглэх: нэг санал зөвхөн нэг бүлэгт орно, үлдсэн нь "Бусад санал" болно
    await pause();
    const proposed = await ai.groupComments(clauseText, relevant);
    const textById = new Map(relevant.map((c) => [c.id, c.text]));
    const used = new Set<string>();
    const groups = proposed
      .map((g) => ({
        title: g.title.trim() || "Санал",
        summary: g.summary,
        ids: g.commentIds.filter((id) => {
          if (!textById.has(id) || used.has(id)) return false;
          used.add(id);
          return true;
        }),
      }))
      .filter((g) => g.ids.length > 0);
    const leftover = relevant.filter((c) => !used.has(c.id)).map((c) => c.id);
    if (leftover.length > 0) {
      groups.push({ title: "Бусад санал", summary: `${leftover.length} санал`, ids: leftover });
    }

    // 5.3 Бүлэг бүрт хариуны төсөл
    for (const g of groups) {
      // Replay нь хариуг гарчиг + хураангуйгаар хайдаг тул өөр заалтын бүлэгтэй давхцвал заалтын дугаар нэмнэ
      const taken = results.groups!.some((x) => x.title === g.title && x.summary === g.summary);
      const summary = taken ? `${g.summary} (${clause.number} заалт)` : g.summary;

      let replyDraft = "";
      try {
        await pause();
        replyDraft = await ai.writeReply(clauseText, {
          title: g.title,
          summary,
          comments: g.ids.map((id) => textById.get(id) as string),
        });
      } catch (err) {
        console.error(`  writeReply ${clause.number} "${g.title}" амжилтгүй:`, err);
      }
      results.groups!.push({ clause: clause.number, title: g.title, summary, comments: g.ids.map(Number), replyDraft });
    }
    console.log(`  ${clause.number}: ${comments.length} санал → ${relevant.length} хамааралтай, ${groups.length} бүлэг`);
  }

  // 6. Хадгална
  writeFileSync(path("results.json"), JSON.stringify(results, null, 2) + "\n");
  const filtered = results.filter!.filter((f) => f.status !== "RELEVANT").length;
  console.log(`\n✓ ${path("results.json")} хадгаллаа: ${changes.length} өөрчлөлт, ${Object.keys(explanations).length} тайлбар, ${results.groups!.length} бүлэг, ${filtered} шүүгдсэн санал`);
  console.log(`Дараагийн алхам: npm run seed -- --replace   (AI дуудахгүй)`);
}

main().catch((e) => {
  console.error("\nАлдаа:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
