// scripts/test-data.ts
// data/ хавтасны файлуудыг seed хийхээс ӨМНӨ шалгана. AI, өгөгдлийн сан дуудахгүй.
// Ажиллуулах: npx tsx scripts/test-data.ts            (data/ хавтсыг шалгана)
//             npx tsx scripts/test-data.ts --data=өөр/хавтас
//             npx tsx scripts/test-data.ts --mask     (саналын утас, имэйлийг *** болгож comments.json-д хадгална)

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { splitWithPreamble } from "../lib/law/split";
import { STAGES } from "../lib/law/types";

const args = process.argv.slice(2);
const dir = args.find((a) => a.startsWith("--data="))?.split("=")[1] ?? "data";
const mask = args.includes("--mask");

const path = (name: string) => join(dir, name);
const readOpt = (name: string) => (existsSync(path(name)) ? readFileSync(path(name), "utf8") : null);

let errors = 0;
const bad = (msg: string) => {
  errors++;
  console.log(`❌ ${msg}`);
};
const warn = (msg: string) => console.log(`⚠ ${msg}`);
const ok = (msg: string) => console.log(`✓ ${msg}`);

// Хувийн мэдээлэл: имэйл, утасны дугаар (5–9-өөр эхэлсэн 8 оронтой, +976 байж болно).
// Он ("2024-2025") 1, 2-оор эхэлдэг тул утас гэж андуурахгүй.
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const PHONE = /(\+?976[\s-]?)?\b[5-9]\d{3}[\s-]?\d{4}\b/g;

// Seed-тэй адилаар заалтын дугаарыг цэвэрлэнэ ("3.1." → "3.1")
const cleanNumber = (n: unknown) => String(n).trim().replace(/\.+$/, "");

type CommentItem = { clause: unknown; text?: unknown; name?: unknown; vote?: unknown };

function main() {
  console.log(`Хавтас: ${dir}\n`);

  // 1. Заавал байх файлууд
  const law = readOpt("law.txt");
  const bill = readOpt("bill.txt");
  if (!law?.trim()) bad(`${path("law.txt")} байхгүй эсвэл хоосон`);
  if (!bill?.trim()) bad(`${path("bill.txt")} байхгүй эсвэл хоосон`);
  if (!law?.trim() || !bill?.trim()) return;

  // 2. Гарчиг ба үе шат
  const title = (readOpt("title.txt") ?? bill.split(/\r?\n/).find((l) => l.trim()) ?? "").trim();
  if (!readOpt("title.txt")) warn(`title.txt байхгүй — bill.txt-ийн эхний мөрийг гарчиг болгоно: "${title}"`);
  else ok(`Гарчиг: ${title}`);

  const stage = readOpt("stage.txt")?.trim() ?? "DISCUSS_DECISION";
  if (!(STAGES as readonly string[]).includes(stage)) bad(`stage.txt буруу: "${stage}" (${STAGES.join(" | ")})`);
  else ok(`Үе шат: ${stage}`);

  // 3. Үндэслэл — "яагаад" гэдгийг зөвхөн эндээс авна
  const reason = readOpt("reason.txt");
  if (!reason?.trim()) warn(`reason.txt байхгүй — "Яагаад" хэсэг "Шалтгааныг төсөлд дурдаагүй." болно`);
  else ok(`Үндэслэл: ${reason.trim().length} тэмдэгт`);

  // 4. Хуулийг заалтаар хуваана
  const { preamble, clauses } = splitWithPreamble(law);
  const numbers = new Set(clauses.map((c) => c.number));
  ok(`Хууль: ${clauses.length} заалт (${clauses.filter((c) => !c.number.includes(".")).length} зүйл)`);
  if (clauses.length === 0) bad(`law.txt-ээс нэг ч заалт олдсонгүй ("3 дугаар зүйл.", "3.1." хэлбэрээр бичсэн эсэхийг шалга)`);
  if (preamble) warn(`Эхний заалтаас өмнөх ${preamble.length} тэмдэгт орхигдоно: "${preamble.slice(0, 80)}…"`);

  const seen = new Map<string, number>();
  for (const c of clauses) seen.set(c.number, (seen.get(c.number) ?? 0) + 1);
  const dupes = [...seen].filter(([, n]) => n > 1).map(([num, n]) => `${num} ×${n}`);
  if (dupes.length) bad(`Давхардсан заалтын дугаар: ${dupes.join(", ")}`);
  const empty = clauses.filter((c) => c.text === "").map((c) => c.number);
  if (empty.length) warn(`Текстгүй заалт: ${empty.join(", ")}`);

  // 5. Төсөлд дурдсан заалтын дугаарууд хуульд байгаа эсэх.
  //    Хуульд байхгүй дугаар нь зөвхөн төсөл тэр заалтыг НЭМЖ байвал зөв.
  const mentioned = new Set(bill.match(/\b\d{1,4}(?:\.\d{1,3})+(?=[^\d]|$)/g)?.map(cleanNumber) ?? []);
  const missing = [...mentioned].filter((n) => !numbers.has(n));
  ok(`Төсөлд ${mentioned.size} заалтын дугаар дурдсан`);
  if (missing.length) {
    warn(`Хуульд байхгүй дугаар: ${missing.join(", ")} — төсөл эдгээрийг нэмж байгаа бол зөв, үгүй бол law.txt-д тэр зүйлийг нэм`);
  }

  // 6. Иргэдийн санал
  const raw = readOpt("comments.json");
  if (!raw) {
    warn(`comments.json байхгүй — санал, бүлэг үүсэхгүй`);
    return;
  }
  let items: CommentItem[];
  try {
    items = JSON.parse(raw);
  } catch {
    bad(`comments.json JSON биш байна`);
    return;
  }
  if (!Array.isArray(items)) {
    bad(`comments.json массив ([ ... ]) байх ёстой`);
    return;
  }

  const perClause = new Map<string, number>();
  let privateCount = 0;
  const texts = new Map<string, number>();
  items.forEach((item, i) => {
    const where = `санал #${i} (заалт ${String(item.clause)})`;
    const text = typeof item.text === "string" ? item.text.trim() : "";
    if (!text) {
      bad(`${where}: текст хоосон`);
      return;
    }
    const number = cleanNumber(item.clause);
    if (!numbers.has(number) && !mentioned.has(number)) {
      bad(`${where}: ийм заалт хуульд ч, төсөлд ч алга — seed алгасна`);
    }
    if (item.vote !== undefined && !["SUPPORT", "OPPOSE", "NEUTRAL"].includes(String(item.vote))) {
      warn(`${where}: vote "${String(item.vote)}" буруу — NEUTRAL болно`);
    }
    if (EMAIL.test(text) || PHONE.test(text)) {
      privateCount++;
      if (!mask) warn(`${where}: утас эсвэл имэйл байна → --mask ашиглаж нуу`);
    }
    EMAIL.lastIndex = 0;
    PHONE.lastIndex = 0;
    perClause.set(number, (perClause.get(number) ?? 0) + 1);
    texts.set(text, (texts.get(text) ?? 0) + 1);
  });

  ok(`Санал: ${items.length} (${[...perClause].map(([n, c]) => `${n}: ${c}`).join(", ")})`);
  const repeated = [...texts.values()].filter((n) => n > 1).length;
  if (repeated) ok(`Яг ижил тексттэй ${repeated} санал байна — filterComments тэдгээрийг DUPLICATE гэж шүүнэ`);
  if (items.length < 20) warn(`Санал цөөн байна (${items.length}) — 20–60 байвал бүлэглэл сайн харагдана`);

  // 7. --mask: утас, имэйлийг *** болгоно (өөр юу ч өөрчлөхгүй)
  if (mask && privateCount > 0) {
    const cleaned = items.map((item) =>
      typeof item.text === "string"
        ? { ...item, text: item.text.replace(EMAIL, "***").replace(PHONE, "***") }
        : item,
    );
    writeFileSync(path("comments.json"), JSON.stringify(cleaned, null, 2) + "\n");
    ok(`${privateCount} санал дахь утас/имэйлийг *** болгож хадгаллаа`);
  }
}

main();
console.log("");
if (errors) {
  console.log(`❌ ${errors} алдаа — засаад дахин ажиллуул`);
  process.exitCode = 1;
} else {
  console.log("✓ data/ бэлэн. Дараагийн алхам: scripts/test-read-amendment.ts");
}
