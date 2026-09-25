// ParliamentAPI client-ийн тест — жинхэнэ сүлжээ хэрэггүй, fetch-ийг хуурамчаар солино: npm test
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { finalReadingVote, getAgendaList, getAgendaVoteList, ParliamentApiError } from "./parliament";
import { supportMajority } from "./points";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.PARLIAMENT_API_URL;
});

function fakeFetch(respond: (url: URL) => Response | Promise<Response>) {
  process.env.PARLIAMENT_API_URL = "https://api.example.test/v1/";
  globalThis.fetch = (async (input: string | URL | Request) => respond(new URL(String(input)))) as typeof fetch;
}

test("parliament: хаяг тохируулаагүй бол ойлгомжтой алдаа", async () => {
  await assert.rejects(getAgendaList(), (e) => e instanceof ParliamentApiError && /PARLIAMENT_API_URL/.test(e.message));
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

test("parliament: хэлэлцэх асуудал ба санал хураалтыг уншина", async () => {
  fakeFetch((url) => {
    if (url.pathname.endsWith("/getAgendaList")) {
      return Response.json({ data: [{ agendaCode: 101, title: " Хууль " }, { nope: true }] });
    }
    assert.equal(url.searchParams.get("agendaCode"), "101");
    return Response.json([
      { support: 40, oppose: 20, total: 60, isFinalReading: false },
      { support: "55", oppose: 12, total: 67, isFinalReading: true, votedAt: "2026-05-01" },
    ]);
  });
  assert.deepEqual(await getAgendaList(), [{ agendaCode: "101", title: "Хууль" }]);
  const votes = await getAgendaVoteList("101");
  assert.equal(votes.length, 2);
  assert.deepEqual(finalReadingVote(votes), { support: 55, oppose: 12, total: 67, isFinalReading: true, votedAt: "2026-05-01" });
});

test("parliament: хэлбэр огт танигдахгүй бол чимээгүй 0 биш, алдаа", async () => {
  fakeFetch(() => Response.json([{ yes: 1, no: 2 }]));
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
