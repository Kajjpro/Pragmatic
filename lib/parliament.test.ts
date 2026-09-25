// ParliamentAPI client-ийн тест — жинхэнэ сүлжээ хэрэггүй, fetch-ийг хуурамчаар солино: npm test
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, test } from "node:test";
import { finalReadingVote, getAgendaList, getAgendaVoteList, ParliamentApiError, resetParliamentToken } from "./parliament";
import { supportMajority } from "./points";

const realFetch = globalThis.fetch;
let snapshots = "";
beforeEach(() => {
  // snapshot-ыг түр хавтсанд бичнэ (data/snapshots-ийг бохирдуулахгүй)
  snapshots = mkdtempSync(join(tmpdir(), "parliament-"));
  process.env.PARLIAMENT_SNAPSHOT_DIR = snapshots;
});
afterEach(() => {
  globalThis.fetch = realFetch;
  resetParliamentToken();
  rmSync(snapshots, { recursive: true, force: true });
  for (const k of ["PARLIAMENT_API_BASE", "PARLIAMENT_API_USER", "PARLIAMENT_API_PASS", "PARLIAMENT_SNAPSHOT_DIR"]) delete process.env[k];
});

type Call = { path: string; body: Record<string, unknown>; auth: string | null };

// login-ийг автоматаар хариулна; ParliamentService-ийн хүсэлтийг respond-д дамжуулна
function fakeFetch(respond: (call: Call) => Response | Promise<Response>, calls: Call[] = []) {
  process.env.PARLIAMENT_API_BASE = "https://api.example.test/ParliamentAPI/";
  process.env.PARLIAMENT_API_USER = "user";
  process.env.PARLIAMENT_API_PASS = "pass";
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    const headers = (init?.headers ?? {}) as Record<string, string>;
    const call = { path: url.pathname, body: JSON.parse(String(init?.body ?? "{}")), auth: headers.Authorization ?? null };
    calls.push(call);
    if (url.pathname.endsWith("/api/login")) {
      return Response.json({ ok: true, access_token: `tok${calls.filter((c) => c.path.endsWith("/api/login")).length}`, expires_in: 21600 });
    }
    return respond(call);
  }) as typeof fetch;
  return calls;
}

test("parliament: нэвтрэх эрх тохируулаагүй бол ойлгомжтой алдаа", async () => {
  await assert.rejects(getAgendaList(), (e) => e instanceof ParliamentApiError && /PARLIAMENT_API_USER/.test(e.message));
});

test("parliament: холбогдохгүй бол ParliamentApiError", async () => {
  fakeFetch(() => {
    throw new TypeError("fetch failed");
  });
  await assert.rejects(getAgendaList(), (e) => e instanceof ParliamentApiError && /холбогдож чадсангүй/.test(e.message));
});

test("parliament: 500 алдаа ба JSON биш хариу", async () => {
  fakeFetch(() => new Response("oops", { status: 500 }));
  await assert.rejects(getAgendaList(), /алдаа буцаалаа \(500\)/);
  fakeFetch(() => new Response("<html>", { status: 200 }));
  await assert.rejects(getAgendaList(), /JSON биш/);
});

test("parliament: нэвтэрч, token-ийг дахин ашиглаж, 401 бол нэг удаа дахин нэвтэрнэ", async () => {
  let first = true;
  const calls = fakeFetch(() => {
    if (first) {
      first = false;
      return Response.json({ data: [{ agendaCode: "20250200075", agendaName: "А" }] });
    }
    return calls.at(-1)?.auth === "Bearer tok1" ? new Response("", { status: 401 }) : Response.json({ data: [] });
  });
  await getAgendaList();
  await getAgendaList();
  const services = calls.filter((c) => c.path.endsWith("/ParliamentService"));
  assert.deepEqual(services.map((c) => [c.path, c.body.func, c.auth]), [
    ["/ParliamentAPI/ParliamentService", "getAgendaList", "Bearer tok1"],
    ["/ParliamentAPI/ParliamentService", "getAgendaList", "Bearer tok1"],
    ["/ParliamentAPI/ParliamentService", "getAgendaList", "Bearer tok2"],
  ]);
  assert.equal(calls.filter((c) => c.path.endsWith("/api/login")).length, 2);
});

test("parliament: API унавал data/snapshots-ийн хуулбарыг уншина", async () => {
  writeFileSync(join(snapshots, "getAgendaList.json"), JSON.stringify({ data: [{ agendaCode: "1", agendaName: "Хуулбар" }] }));
  fakeFetch(() => new Response("", { status: 503 }));
  assert.deepEqual(await getAgendaList(), [{ agendaCode: "1", title: "Хуулбар" }]);
});

test("parliament: хэлэлцэх асуудал ба санал хураалтыг уншина", async () => {
  fakeFetch(({ body }) => {
    if (body.func === "getAgendaList") {
      return Response.json({ data: [{ agendaCode: 20250200075, agendaName: " Хууль " }, { nope: true }] });
    }
    assert.deepEqual(body, { func: "getAgendaVoteList", agendaCode: "20250200075" });
    return Response.json({
      count: 2,
      data: [
        { MeetingID: 170, zovshooron: 40, tatgalzsan: 20, niit: 60, customId: "a", voteType: "Анхны хэлэлцүүлэг" },
        { MeetingID: 174, zovshooron: "55", tatgalzsan: 12, niit: 67, customId: "b", voteType: "Эцсийн хэлэлцүүлэг" },
      ],
    });
  });
  assert.deepEqual(await getAgendaList(), [{ agendaCode: "20250200075", title: "Хууль" }]);
  const votes = await getAgendaVoteList("20250200075");
  assert.equal(votes.length, 2);
  assert.equal(votes[0].isFinalReading, false);
  assert.deepEqual(finalReadingVote(votes), { support: 55, oppose: 12, total: 67, isFinalReading: true, votedAt: null });
});

test("parliament: хэлбэр огт танигдахгүй бол чимээгүй 0 биш, алдаа", async () => {
  fakeFetch(() => Response.json({ data: [{ yes: 1, no: 2 }] }));
  await assert.rejects(getAgendaVoteList("1"), /хэлбэр танигдсангүй/);
});

test("parliament: эцсийн хэлэлцүүлэг болоогүй бол null", () => {
  assert.equal(finalReadingVote([{ support: 1, oppose: 0, total: 1, isFinalReading: false, votedAt: null }]), null);
  assert.equal(finalReadingVote([]), null);
});

test("дэмжсэн нь олонх: зөвхөн дэмжсэн > эсэргүүцсэн", () => {
  assert.equal(supportMajority({ support: 40, oppose: 30, total: 70 }), true);
  assert.equal(supportMajority({ support: 30, oppose: 30, total: 60 }), false);
  assert.equal(supportMajority({ support: 10, oppose: 30, total: 40 }), false);
});
