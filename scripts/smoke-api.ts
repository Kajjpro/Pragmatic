// Нийтийн API-г дуудаж status, тоо, хугацааг хэвлэнэ. Серверийг асаасан байх ёстой.
//   npm run smoke                                   (http://localhost:3000)
//   BASE_URL=https://hariu.vercel.app npm run smoke  (production)
//   BADGE_ID=<id> npm run smoke                      (жинхэнэ тэмдгийг шалгах)
import type { FeedCard, PublicBadge, VoteEvent } from "../lib/types";

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

type Result = { ok: boolean; line: string };
const results: Result[] = [];

async function call(
  label: string,
  path: string,
  expectStatus: number,
  opts: { method?: "GET" | "POST"; body?: unknown; describe?: (json: unknown) => string } = {},
): Promise<unknown> {
  const started = Date.now();
  let status = 0;
  let json: unknown = null;
  let note = "";
  try {
    const res = await fetch(BASE + path, {
      method: opts.method ?? "GET",
      headers: opts.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
    status = res.status;
    json = await res.json().catch(() => null);
    if (status >= 400) {
      // Алдаа бүр { error: "монгол текст" } хэлбэртэй байх ёстой
      const error = (json as { error?: unknown } | null)?.error;
      note = typeof error === "string" ? `error: "${error}"` : "⚠ { error } хэлбэргүй алдаа";
    } else if (opts.describe) {
      note = opts.describe(json);
    }
  } catch (e) {
    note = `холбогдож чадсангүй: ${e instanceof Error ? e.message : e}`;
  }

  const ms = Date.now() - started;
  const ok = status === expectStatus && !note.startsWith("⚠");
  results.push({
    ok,
    line: `${ok ? "✓" : "✗"} ${String(status).padEnd(3)} ${String(ms).padStart(5)}ms  ${label.padEnd(34)} ${note}`,
  });
  return ok ? json : null;
}

// Зураг буцаадаг route (JSON биш): status, төрөл, хэмжээг шалгана
async function callImage(label: string, path: string) {
  const started = Date.now();
  let status = 0;
  let note = "";
  try {
    const res = await fetch(BASE + path);
    status = res.status;
    const type = res.headers.get("content-type") ?? "";
    const bytes = (await res.arrayBuffer()).byteLength;
    note = type.startsWith("image/png") ? `PNG ${Math.round(bytes / 1024)}KB` : `⚠ зураг биш (${type})`;
  } catch (e) {
    note = `холбогдож чадсангүй: ${e instanceof Error ? e.message : e}`;
  }
  const ok = status === 200 && note.startsWith("PNG");
  results.push({
    ok,
    line: `${ok ? "✓" : "✗"} ${String(status).padEnd(3)} ${String(Date.now() - started).padStart(5)}ms  ${label.padEnd(34)} ${note}`,
  });
}

async function main() {
  console.log(`Smoke test → ${BASE}\n`);

  // ── Картууд ──
  const all = (await call("GET /api/feed", "/api/feed", 200, {
    describe: (j) => {
      const cards = j as FeedCard[];
      const questions = cards.reduce((n, c) => n + c.quiz.length, 0);
      const leaked = JSON.stringify(cards).includes("correctIndex") ? "  ⚠ correctIndex гарсан!" : "";
      return `${cards.length} карт, ${questions} асуулт${leaked}`;
    },
  })) as FeedCard[] | null;

  for (const persona of ["STUDENT", "DRIVER", "WORKER", "PARENT", "ALL"]) {
    await call(`GET /api/feed?persona=${persona}`, `/api/feed?persona=${persona}`, 200, {
      describe: (j) => `${(j as FeedCard[]).length} карт`,
    });
  }
  await call("GET /api/feed?persona=ROBOT", "/api/feed?persona=ROBOT", 400);

  // ── Санал хураалт ──
  await call("GET /api/vote-events", "/api/vote-events", 200, {
    describe: (j) => {
      const events = j as VoteEvent[];
      const open = events.filter((e) => e.status === "OPEN").length;
      const revealed = events.filter((e) => e.status === "REVEALED").length;
      const replay = events.filter((e) => e.isReplay).length;
      const leaked = JSON.stringify(events).includes("hidden") ? "  ⚠ нууц тоо гарсан!" : "";
      return `${events.length} (OPEN ${open}, REVEALED ${revealed}, replay ${replay})${leaked}`;
    },
  });

  // ── Тэмдэг ──
  if (process.env.BADGE_ID) {
    await call("GET /api/badges/[id]", `/api/badges/${process.env.BADGE_ID}`, 200, {
      describe: (j) => {
        const b = j as PublicBadge;
        const leaked = JSON.stringify(b).includes("@") ? "  ⚠ имэйл гарсан!" : "";
        return `${b.type}, ${b.firstName}, ${b.lawTitle ?? "-"} ${b.clauseNumber ?? ""}${leaked}`;
      },
    });
    await callImage("GET /api/badges/[id]/image", `/api/badges/${process.env.BADGE_ID}/image`);
  }
  await call("GET /api/badges/[unknown]", "/api/badges/does-not-exist", 404);

  // ── Хуулийн төслүүд (v1) ──
  await call("GET /api/bills", "/api/bills", 200, { describe: (j) => `${(j as unknown[]).length} төсөл` });

  // ── Зочин: карт үзэх, асуултад хариулах нь алдаа биш (saved: false) ──
  const card = all?.find((c) => c.quiz.length > 0) ?? all?.[0];
  if (card) {
    await call("POST /api/cards/[id]/view (зочин)", `/api/cards/${card.id}/view`, 200, {
      method: "POST",
      describe: (j) => `saved: ${(j as { saved: boolean }).saved}`,
    });
    const q = card.quiz[0];
    if (q) {
      await call("POST /api/quiz/[id]/answer (зочин)", `/api/quiz/${q.id}/answer`, 200, {
        method: "POST",
        body: { chosenIndex: 0 },
        describe: (j) => {
          const r = j as { saved: boolean; correct: boolean };
          return `saved: ${r.saved}, correct: ${r.correct}`;
        },
      });
      await call("POST /api/quiz/[id]/answer (буруу)", `/api/quiz/${q.id}/answer`, 400, {
        method: "POST",
        body: { chosenIndex: 99 },
      });
    }
  } else {
    results.push({ ok: true, line: "-                 карт алга — seed ажиллуулаагүй бол зочны шалгалтыг алгасав" });
  }
  await call("POST /api/cards/[unknown]/view", "/api/cards/does-not-exist/view", 404, { method: "POST" });

  // ── Нэвтрэх шаардлагатай route-ууд нэвтрээгүй үед 401 ──
  await call("GET /api/me (нэвтрээгүй)", "/api/me", 401);
  await call("POST /api/me/persona (нэвтрээгүй)", "/api/me/persona", 401, {
    method: "POST",
    body: { persona: "STUDENT" },
  });
  await call("POST /api/vote-events/[id]/predict", "/api/vote-events/x/predict", 401, {
    method: "POST",
    body: { willPass: true, supportGuess: 70 },
  });

  // ── Ажилтны route-ууд нэвтрээгүй үед 401 ──
  await call("POST /api/staff/vote-events/sync", "/api/staff/vote-events/sync", 401, { method: "POST" });
  await call("POST /api/staff/.../[id]/reveal", "/api/staff/vote-events/x/reveal", 401, { method: "POST" });

  for (const r of results) console.log(r.line);
  const failed = results.filter((r) => !r.ok).length;
  console.log(failed ? `\n✗ ${failed} шалгалт амжилтгүй` : `\n✓ Бүгд амжилттай (${results.length})`);
  if (failed) process.exitCode = 1;
}

main();
