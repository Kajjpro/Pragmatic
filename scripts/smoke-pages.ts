// scripts/smoke-pages.ts
// Ажиллаж буй сайтын бүх хуудас, нийтийн API-г шалгана (fetch-ээр).
//   - Хуудас бүр 200 буцааж, үндсэн гарчгаа агуулж байх ёстой.
//   - Нийтийн API бүр 200 буцааж, өгөгдөлтэй байх ёстой.
// Ажиллуулах: npm run smoke:pages                       (http://localhost:3000)
//             BASE_URL=https://hariu.vercel.app npm run smoke:pages
//             BADGE_ID=<id> — тэмдгийн хуудсыг ч шалгана

const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const BADGE_ID = process.env.BADGE_ID;

let failures = 0;
let warnings = 0;

function report(ok: boolean, name: string, detail: string, warnOnly = false) {
  if (ok) {
    console.log(`  ✅ ${name} — ${detail}`);
  } else if (warnOnly) {
    warnings++;
    console.log(`  ⚠️  ${name} — ${detail}`);
  } else {
    failures++;
    console.log(`  ❌ ${name} — ${detail}`);
  }
}

// HTML-ийн тэмдэгтүүдийг (&amp; гэх мэт) энгийн текст болгож харьцуулна
function decode(html: string): string {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function page(path: string, heading: string, expectStatus = 200) {
  try {
    const res = await fetch(BASE + path, { redirect: "manual" });
    const html = decode(await res.text());
    const hasHeading = html.includes(heading);
    report(res.status === expectStatus && hasHeading, `GET ${path}`, `${res.status}, гарчиг «${heading}» ${hasHeading ? "байна" : "АЛГА"}`);
    return html;
  } catch (e) {
    report(false, `GET ${path}`, String(e));
    return "";
  }
}

async function api(path: string, check: (data: unknown) => string | null, warnIfEmpty = false) {
  try {
    const res = await fetch(BASE + path);
    const data = await res.json().catch(() => null);
    if (res.status !== 200) {
      report(false, `API ${path}`, `${res.status}`);
      return;
    }
    const problem = check(data);
    report(problem === null, `API ${path}`, problem ?? "200, өгөгдөлтэй", warnIfEmpty);
  } catch (e) {
    report(false, `API ${path}`, String(e));
  }
}

const nonEmptyArray = (d: unknown) => (Array.isArray(d) && d.length > 0 ? null : "хоосон жагсаалт");

async function main() {
  console.log(`Хариу — хуудасны шалгалт: ${BASE}\n`);

  console.log("Хуудас:");
  await page("/", "Хууль таны амьдралыг өөрчилдөг");
  const list = await page("/bills", "Хуулийн өөрчлөлт");
  const billId = list.match(/href="\/bills\/([^"#?/]+)"/)?.[1];
  if (billId) {
    await page(`/bills/${billId}`, "Товч дүгнэлт");
  } else {
    report(false, "GET /bills/[id]", "жагсаалтаас хууль олдсонгүй");
  }
  await page("/feed", "Өнөөдрийн хууль");
  await page("/predict", "Таамаг");
  await page("/me", "Миний оролцоо");
  await page("/sign-in", "Хариу");
  if (BADGE_ID) await page(`/b/${BADGE_ID}`, "Хууль өөрчилсөн иргэн");
  await page("/ийм-хуудас-байхгүй", "Хуудас олдсонгүй", 404);

  // Ажилтны хэсэг: нэвтрээгүй хүнийг нэвтрэх хуудас руу шилжүүлнэ
  try {
    const res = await fetch(BASE + "/staff", { redirect: "manual" });
    const location = res.headers.get("location") ?? "";
    report(res.status >= 300 && res.status < 400 && location.includes("sign-in"), "GET /staff (зочин)", `${res.status} → ${location || "(шилжүүлэлтгүй)"}`);
  } catch (e) {
    report(false, "GET /staff (зочин)", String(e));
  }

  console.log("\nНийтийн API:");
  await api("/api/bills", nonEmptyArray);
  if (billId) await api(`/api/bills/${billId}`, (d) => (d && typeof d === "object" && "title" in d ? null : "title алга"));
  await api("/api/feed?persona=ALL", nonEmptyArray);
  await api("/api/vote-events", nonEmptyArray, true); // санал хураалт нэмэгдээгүй байж болно
  await api("/api/stats/live", (d) => (d && typeof d === "object" && "updatedAt" in d ? null : "updatedAt алга"));
  if (BADGE_ID) await api(`/api/badges/${BADGE_ID}`, (d) => (d && typeof d === "object" && "firstName" in d ? null : "firstName алга"));

  console.log(`\nДүн: ${failures} алдаа, ${warnings} анхааруулга`);
  if (failures > 0) process.exit(1);
}

main();
