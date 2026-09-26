// Нэг төсөлд заалт бүрийн ХАРЬЦУУЛАЛТ нэмнэ (хүчин төгөлдөр хууль ↔ төсөл).
//   npx tsx --env-file=.env scripts/add-comparison.ts --bill=lf-11057 --law=data/laws/lf-11057.txt
//   … --reason=data/laws/lf-11057-reason.txt   (танилцуулга байвал — "Яагаад" тайлбар сайжирна)
//   … --stub                                   (AI дуудахгүй, зөвхөн бүтэц шалгах)
//   … --force                                  (заалт тулгагдаагүй байхад ч бичих — болгоомжтой)
//
// ЯАГААД ГАРААР ХУУЛИЙН ТЕКСТ ӨГӨХ ВЭ:
//   Төслийн эх бичвэрийг lawforum.parliament.mn-ээс код өөрөө татна.
//   Харин ХҮЧИН ТӨГӨЛДӨР хуулийн нэгдсэн эхийг зөвхөн legalinfo.mn нийтэлдэг бөгөөд
//   тэр хуудас нь текстээ хөтөч дээр л ачаалдаг тул скриптээр татагдахгүй.
//   Тиймээс: legalinfo.mn дээрх хуулийг хөтчөөр нээж, бүх текстийг хуулж аваад
//   data/laws/<төслийн key>.txt файлд хадгална. Дараа нь энэ скриптийг ажиллуулна.
//
// Скрипт юу хийдэг вэ:
//   1. lawforum-оос төслийн албан ёсны текстийг татна
//   2. хуулийг заалт болгон хуваана (splitIntoClauses)
//   3. AI төслийг өөрчлөлтийн жагсаалт болгоно (readAmendment), кодоор хэрэгжүүлнэ (applyChanges)
//   4. үг тутмын ялгааг кодоор гаргана (compareWords), AI энгийн тайлбар бичнэ (explainChange)
//   5. үр дүнг data/precomputed.json-д бичнэ → дараа нь `npm run seed`
//
// Хэрэв төсөлд иш татсан үг хуулийн текстээс олдохгүй бол (хуулийн хуучин хувилбар өгсөн гэсэн үг)
// тэр заалтыг "тулгагдсангүй" гэж мэдээлээд юу ч бичихгүй — буруу харьцуулалт гаргахгүйн тулд.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { buildClauses } from "../lib/law/pipeline";
import { parseSeedData, type SeedClause, type SeedData } from "../lib/seed";

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
const flag = (name: string) => process.argv.includes(`--${name}`);

async function main() {
  if (flag("stub")) process.env.AI_STUB = "true";
  const billKey = arg("bill");
  const lawPath = arg("law");
  if (!billKey || !lawPath) throw new Error("Хэрэглээ: --bill=<төслийн key> --law=<хуулийн текст файл>");
  if (!existsSync(lawPath)) throw new Error(`${lawPath} алга — legalinfo.mn-ээс хуулийн текстийг хуулж энд хадгална уу`);

  const data: SeedData = parseSeedData(readFileSync("data/precomputed.json", "utf8"));
  const bill = data.bills.find((b) => b.key === billKey);
  if (!bill) throw new Error(`"${billKey}" төсөл data/precomputed.json-д алга (жишээ: lf-11057)`);
  if (bill.key === "demo") throw new Error("Демо төслийн харьцуулалтыг scripts/precompute.ts гаргадаг");

  // 1. Төслийн эх бичвэр — lawforum-ын нийтийн хуудаснаас
  const lawforumId = bill.lawforumId ?? Number(billKey.replace(/^lf-/, ""));
  const billText = await fetchBillText(lawforumId);
  if (billText === "") throw new Error(`lawforum дээрх ${lawforumId} төслийн текст олдсонгүй (зөвхөн файлтай төсөл байж магадгүй)`);
  console.log(`Төслийн текст: ${billText.length} тэмдэгт (lawforum ${lawforumId})`);

  const currentLawText = readFileSync(lawPath, "utf8");
  const reasonPath = arg("reason");
  const reasonText = reasonPath && existsSync(reasonPath) ? readFileSync(reasonPath, "utf8") : null;
  console.log(`Хуулийн текст: ${currentLawText.length} тэмдэгт (${lawPath})`);

  // 2-4. Заалт болгон хувааж, өөрчлөлтийг хэрэгжүүлж, ялгаа + тайлбарыг гаргана
  const built = await buildClauses({ currentLawText, amendmentText: billText, reasonText });
  const changed = built.filter((c) => c.changeType !== "UNCHANGED");
  const failed = changed.filter((c) => c.applyError);

  console.log(`\n${built.length} заалт, ${changed.length} өөрчлөгдсөн:`);
  for (const c of changed) {
    console.log(`  ${c.applyError ? "✗" : "✓"} ${c.number} ${c.changeType}${c.applyError ? " — төслийн иш хуулийн текстээс олдсонгүй" : ""}`);
  }

  if (changed.length === 0) throw new Error("Өөрчлөгдсөн заалт гарсангүй — хуулийн текст эсвэл төсөл таарахгүй байна");
  if (failed.length > 0 && !flag("force")) {
    throw new Error(
      `${failed.length} заалт тулгагдсангүй (${failed.map((c) => c.number).join(", ")}). ` +
        "Хуулийн ХҮЧИН ТӨГӨЛДӨР (шинэчлэгдсэн) эхийг өгсөн эсэхээ шалгана уу. Мэдсээр байж бичих бол --force.",
    );
  }

  // 5. precomputed.json-д бичнэ
  bill.comparison = changed.map(
    (c): SeedClause => ({
      number: c.number,
      oldText: c.oldText,
      newText: c.newText,
      changeType: c.changeType as SeedClause["changeType"],
      sourceQuote: c.sourceQuote,
      what: c.what,
      why: c.why,
      who: c.who,
    }),
  );
  bill.lawText = currentLawText;
  bill.billText = billText;
  if (reasonText) bill.reasonText = reasonText;

  writeFileSync("data/precomputed.json", `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`\ndata/precomputed.json: "${bill.key}" төсөлд ${changed.length} заалтын харьцуулалт бичлээ.`);
  console.log("Дараа нь: npm run seed");
}

// ───────────── lawforum-ын нийтийн хуудаснаас төслийн текст ─────────────
// (scripts/precompute.ts-ийн аргачлалтай ижил: "МОНГОЛ УЛСЫН ХУУЛЬ"-аас "Төслийн файлууд" хүртэл)

async function fetchBillText(id: number): Promise<string> {
  const res = await fetch(`https://lawforum.parliament.mn/project/${id}`);
  if (!res.ok) return "";
  let html = await res.text();
  html = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, "");
  html = html.replace(/<a href="\/(?:projectrefcomments|prca)\/[^"]*"[\s\S]*?<\/a>/g, "");
  html = html.replace(/<br\s*\/?>|<\/(?:div|p|li|h\d)>/gi, "\n");
  const text = decodeEntities(html.replace(/<[^>]+>/g, ""));

  const lines: string[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.replace(/[ \t ]+/g, " ").trim();
    if (line !== "") lines.push(line);
  }
  const start = lines.findIndex((l) => l === "МОНГОЛ УЛСЫН ХУУЛЬ" || l === "МОНГОЛ УЛСЫН ИХ ХУРЛЫН ТОГТООЛ");
  if (start === -1) return "";

  const body: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith("Төслийн файлууд")) break;
    if (/^\d{4} оны .* өдөр/.test(lines[i])) continue;
    body.push(lines[i]);
  }
  return body.join("\n");
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&amp;/g, "&");
}

main().catch((e) => {
  console.error(`\nadd-comparison амжилтгүй: ${e instanceof Error ? e.message : e}`);
  process.exitCode = 1;
});
