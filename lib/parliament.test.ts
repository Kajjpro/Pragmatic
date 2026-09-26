// ParliamentAPI client-ийн тест — жинхэнэ сүлжээ хэрэггүй, fetch-ийг хуурамч сервераар солино: npm test
// Санал хураалтын текстүүд нь бодит API-ийн хариунаас (2026-09-26).
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  finalReadingVote,
  getAgendaList,
  getAgendaVoteList,
  getVotingList,
  ParliamentApiError,
  parseAgendaList,
  parseAgendaVoteList,
  parseMeetings,
  parseMembers,
  parseVotingList,
  parseVotingResult,
  type AgendaVote,
} from "./parliament";
import { supportMajority } from "./points";

const realFetch = globalThis.fetch;
const realEnv = { ...process.env };
afterEach(() => {
  globalThis.fetch = realFetch;
  for (const key of ["PARLIAMENT_API_URL", "PARLIAMENT_API_USER", "PARLIAMENT_API_PASS"]) {
    if (realEnv[key] === undefined) delete process.env[key];
    else process.env[key] = realEnv[key];
  }
});

type FakeCall = { path: string; body: Record<string, unknown>; auth: string | null; cookie: string | null };

// Хуурамч ParliamentAPI: /api/login нь token + JSESSIONID cookie өгнө, бусад дуудлагыг handle хариулна.
// Тест бүр шинэ хаягтай тул өмнөх тестийн сесс дахин хэрэглэгдэхгүй.
let servers = 0;
function fakeServer(handle: (call: FakeCall, n: number) => Response, options: { expiresIn?: number; loginStatus?: number } = {}) {
  servers++;
  process.env.PARLIAMENT_API_URL = `https://parliament-${servers}.example.test/ParliamentAPI/`;
  process.env.PARLIAMENT_API_USER = "test-user";
  process.env.PARLIAMENT_API_PASS = "test-pass";
  const state = { logins: 0, calls: [] as FakeCall[] };

  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    const headers = new Headers(init?.headers);
    const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
    const path = url.pathname.replace(/^\/ParliamentAPI/, "");
    if (path === "/api/login") {
      state.logins++;
      assert.deepEqual(body, { username: "test-user", password: "test-pass" });
      if (options.loginStatus) return Response.json({ ok: false }, { status: options.loginStatus });
      return new Response(
        JSON.stringify({ access_token: `tok${state.logins}`, ok: true, token_type: "Bearer", expires_in: options.expiresIn ?? 21600 }),
        { headers: { "Content-Type": "application/json", "Set-Cookie": `JSESSIONID=s${state.logins}; Path=/ParliamentAPI; HttpOnly` } },
      );
    }
    const call = { path, body, auth: headers.get("authorization"), cookie: headers.get("cookie") };
    state.calls.push(call);
    return handle(call, state.calls.length);
  }) as typeof fetch;
  return state;
}

const tokenWrong = () => Response.json({ ok: false, msg: "token buruu" }, { status: 401 });
const emptyList = () => Response.json({ data: [], user_id: 5, ok: true });

// ───────────── Холболт ─────────────

test("parliament: тохиргоо дутуу бол ойлгомжтой алдаа", async () => {
  delete process.env.PARLIAMENT_API_URL;
  delete process.env.PARLIAMENT_API_USER;
  delete process.env.PARLIAMENT_API_PASS;
  await assert.rejects(getAgendaList(), (e) => e instanceof ParliamentApiError && /PARLIAMENT_API_URL/.test(e.message));
});

test("parliament: Bearer token БА JSESSIONID cookie хоёулаа явна, token-ийг дахин ашиглана", async () => {
  const state = fakeServer(() => Response.json({ data: [{ agendaCode: "20250200075", agendaName: "Хууль" }], ok: true }));
  await getAgendaList();
  await getAgendaList();
  assert.equal(state.logins, 1);
  assert.deepEqual(
    state.calls.map((c) => [c.path, c.body.func, c.auth, c.cookie]),
    [
      ["/ParliamentService", "getAgendaList", "Bearer tok1", "JSESSIONID=s1"],
      ["/ParliamentService", "getAgendaList", "Bearer tok1", "JSESSIONID=s1"],
    ],
  );
});

test("parliament: зэрэг олон дуудлага нэг л удаа нэвтэрнэ", async () => {
  const state = fakeServer(emptyList);
  await Promise.all([getAgendaList(), getAgendaList(), getAgendaList()]);
  assert.equal(state.logins, 1);
});

test("parliament: 401 ирвэл дахин нэвтэрч нэг удаа давтана", async () => {
  const state = fakeServer((_call, n) => (n === 1 ? tokenWrong() : emptyList()));
  assert.deepEqual(await getAgendaList(), []);
  assert.equal(state.logins, 2);
  assert.deepEqual([state.calls[1].auth, state.calls[1].cookie], ["Bearer tok2", "JSESSIONID=s2"]);
});

test("parliament: дахин нэвтэрсний дараа ч 401 бол алдаа (гурав дахь удаа оролдохгүй)", async () => {
  const state = fakeServer(tokenWrong);
  await assert.rejects(getAgendaList(), (e) => e instanceof ParliamentApiError && /401/.test(e.message));
  assert.equal(state.calls.length, 2);
});

test("parliament: token дуусахаас 5 минутын өмнө шинэчилнэ", async () => {
  const state = fakeServer(emptyList, { expiresIn: 60 }); // 1 минут < 5 минут → шууд хуучирсан гэж үзнэ
  await getAgendaList();
  await getAgendaList();
  assert.equal(state.logins, 2);
});

test("parliament: нэвтрэх нэр, нууц үг буруу", async () => {
  fakeServer(emptyList, { loginStatus: 401 });
  await assert.rejects(getAgendaList(), (e) => e instanceof ParliamentApiError && /PARLIAMENT_API_USER/.test(e.message));
});

test("parliament: HTTP 200 доторх алдааг таньна", async () => {
  fakeServer((call) =>
    call.body.func === "getVotingList"
      ? Response.json({ user_id: 5, ok: false, error: "parameter dutuu" })
      : Response.json({ data: [], user_id: 5, success: false, ok: true, message: "Agenda code буруу байна." }),
  );
  await assert.rejects(getVotingList(1), (e) => e instanceof ParliamentApiError && /parameter dutuu/.test(e.message));
  await assert.rejects(getAgendaVoteList("123"), /Agenda code буруу байна/);
});

test("parliament: холбогдохгүй, 500, JSON биш хариу", async () => {
  fakeServer(emptyList);
  globalThis.fetch = (async () => {
    throw new TypeError("fetch failed");
  }) as typeof fetch;
  await assert.rejects(getAgendaList(), /холбогдож чадсангүй/);

  fakeServer(() => new Response("oops", { status: 500 }));
  await assert.rejects(getAgendaList(), /алдаа буцаалаа \(500\)/);

  fakeServer(() => new Response("<html>", { status: 200 }));
  await assert.rejects(getAgendaList(), /JSON биш/);
});

// ───────────── Хариуг унших ─────────────

test("parse: хэлэлцэх асуудлын нэрийг цэвэрлэнэ, танигдаагүй мөрийг алгасна", () => {
  const body = { data: [{ agendaCode: "20250200075", agendaName: ".Аж ахуйн нэгжийн  орлогын\nалбан татвар" }, { nope: true }] };
  assert.deepEqual(parseAgendaList(body), [{ agendaCode: "20250200075", title: "Аж ахуйн нэгжийн орлогын албан татвар" }]);
});

test("parse: санал хураалт — талбарууд, Улаанбаатарын цаг, туршилтын хуралдааныг хасна", () => {
  const body = {
    success: true,
    ok: true,
    data: [
      {
        tatgalzsan: 40, voteType: "Хэлэлцэх эсэх", agendaCode: "20250200075", customId: "549_202512310038118",
        zovshooron: 31, niit: 71, agendaName: ".Аж ахуйн нэгжийн орлогын албан татварын тухай хуульд", MeetingID: 549,
        name: "2.Аж ахуйн нэгжийн орлогын албан татварын тухай хуульд нэмэлт, өөрчлөлт оруулах\nтухай хуулийн төслийг яаралтай хэлэлцэхийг дэмжье",
        khorooName: "ЧУУЛГАНЫ НЭГДСЭН ХУРАЛДААН", irts: 71, votingdate: "2025.12.31 11:13", showType: 0,
      },
      { tatgalzsan: 0, voteType: "Ирц", agendaCode: "20260000003", customId: "670_1", zovshooron: 5, niit: 5, name: "tttttttttt", khorooName: "Тест хурал", votingdate: "2026.09.04 16:01" },
    ],
  };
  assert.deepEqual(parseAgendaVoteList(body), [
    {
      customId: "549_202512310038118",
      agendaCode: "20250200075",
      agendaTitle: "Аж ахуйн нэгжийн орлогын албан татварын тухай хуульд",
      meetingId: 549,
      name: "2.Аж ахуйн нэгжийн орлогын албан татварын тухай хуульд нэмэлт, өөрчлөлт оруулах тухай хуулийн төслийг яаралтай хэлэлцэхийг дэмжье",
      voteType: "Хэлэлцэх эсэх",
      support: 31,
      oppose: 40,
      total: 71,
      present: 71,
      votedAt: "2025-12-31T03:13:00.000Z", // 11:13 Улаанбаатар = 03:13 UTC
    },
  ]);
});

test("parse: хэлбэр танигдахгүй бол чимээгүй 0 биш, алдаа", () => {
  assert.throws(() => parseAgendaVoteList({ data: [{ yes: 1, no: 2 }] }), /хэлбэр танигдсангүй/);
  assert.throws(() => parseAgendaList({ rows: [] }), /хэлбэр танигдсангүй/);
  assert.throws(() => parseMembers({ okay: true, res: {} }), /хэлбэр танигдсангүй/);
});

test("parse: хуралдаан, хуралдааны санал хураалт, гишүүн бүрийн санал, гишүүд", () => {
  const meetings = parseMeetings({
    data: [{ startmeeting: "2026-09-07 10:02:39.403", start: "2026-09-07 09:00:00.603", ended: "2026-09-07 23:14:23.287", description: "НЭГДСЭН ХУРАЛДААН", id: 671, title: "ЧУУЛГАНЫ НЭГДСЭН ХУРАЛДААН" }],
  });
  assert.deepEqual(meetings[0], {
    id: 671,
    title: "ЧУУЛГАНЫ НЭГДСЭН ХУРАЛДААН",
    description: "НЭГДСЭН ХУРАЛДААН",
    startsAt: "2026-09-07T01:00:00.603Z",
    openedAt: "2026-09-07T02:02:39.403Z",
    endedAt: "2026-09-07T15:14:23.287Z",
  });

  assert.deepEqual(parseVotingList({ data: [{ zovshooron: 60, tatgalzsan: 26, niit: 86, name: "ирц", customId: "657_2026070300310631" }] }), [
    { customId: "657_2026070300310631", meetingId: 657, name: "ирц", support: 60, oppose: 26, total: 86 },
  ]);

  assert.deepEqual(parseVotingResult({ data: [{ date: "2025-12-31 11:12:35.853", voteResult: "Зөвшөөрсөн", index: 1, voted: 1, middleName: "Бат.Д" }] }), [
    { member: "Бат.Д", result: "Зөвшөөрсөн", voted: true, votedAt: "2025-12-31T03:12:35.853Z" },
  ]);

  assert.deepEqual(parseMembers({ okay: true, res: { members: [] }, user_id: 5 }), []);
  assert.deepEqual(parseMembers({ okay: true, res: { members: [{ email: "bat@parliament.mn", name: "Бат" }] } }), [
    { key: "bat@parliament.mn", name: "Бат", email: "bat@parliament.mn", data: { email: "bat@parliament.mn", name: "Бат" } },
  ]);
});

// ───────────── Эцсийн санал хураалт ─────────────

let seq = 0;
function vote(agendaCode: string, agendaTitle: string, voteType: string, name: string, support: number, oppose: number, votedAt: string): AgendaVote {
  seq++;
  return { customId: `1_${seq}`, agendaCode, agendaTitle, meetingId: 1, name, voteType, support, oppose, total: support + oppose, present: support + oppose, votedAt };
}

test("эцсийн санал хураалт: горимын санал биш, дахин санал хураасан бол сүүлийнх", () => {
  const title = "Амьтны тухай хуульд нэмэлт оруулах тухай хуулийн төсөл";
  const a = (type: string, name: string, s: number, o: number) => vote("20250100037", title, type, name, s, o, "2025-05-09T02:05:00.000Z");
  const votes = [
    a("Хэлэлцэх эсэх", "Амьтны тухай хуульд нэмэлт оруулах тухай хуулийн төслийг хэлэлцэх нь зүйтэй гэсэн санал хураалт явуулъя.", 70, 10),
    a("Эцэслэн батлах", "1.Төслийн 1 дүгээр зүйл буюу 25.7 дугаар зүйлийг өөрчлөн найруулах:", 52, 42),
    a("Эцэслэн батлах", "Амьтны тухай хуульд нэмэлт оруулах тухай хуулийн төслийг эцэслэн батлах санал хураалт явуулъя.", 63, 22),
    a("Эцэслэн батлах", "Улсын Их Хурлын гишүүн Х.Баасанжаргалын гаргасан горимын саналыг дэмжье гэсэн санал хураалт явуулъя.", 61, 25),
    a("Эцэслэн батлах", "Амьтны тухай хуульд нэмэлт оруулах тухай хуулийн төслийг эцэслэн батлах санал хураалтыг дахин явуулъя.", 66, 21),
  ];
  assert.deepEqual([finalReadingVote(votes)?.support, finalReadingVote(votes)?.oppose], [66, 21]);
  // Дахин санал хураалтаас өмнө бол эхний батлах санал хураалт
  assert.equal(finalReadingVote(votes.slice(0, 4))?.support, 63);
});

test("эцсийн санал хураалт: хамт өргөн мэдүүлсэн өөр төслийнхийг авахгүй", () => {
  const title = "БНМАУ-ын Засгийн газарт эрх олгох тухай хууль хүчингүй  болсонд тооцох тухай хуулийн төсөл";
  const b = (name: string, s: number, o: number) => vote("20260100103", title, "Эцэслэн батлах", name, s, o, "2026-06-05T02:16:00.000Z");
  const final = finalReadingVote([
    b("1.БНМАУ-ын Засгийн газарт эрх олгох тухай хууль хүчингүй болсонд тооцох тухай хуулийн төслийг эцэслэн батлах санал хураалт явуулъя.", 68, 8),
    b("2.Төсвийн тогтвортой байдлын тухай хуульд өөрчлөлт оруулах тухай хуулийн төслийг эцэслэн батлах санал хураалт явуулъя.", 61, 15),
  ]);
  assert.deepEqual([final?.support, final?.oppose], [68, 8]);
});

test("эцсийн санал хураалт: асуудлын кодын оноос өмнөх ижил нэртэй санал хураалтыг авахгүй", () => {
  const title = "“Хянан шалгах түр хороо байгуулах тухай” Улсын Их Хурлын  тогтоолын төсөл";
  const name = "Хянан шалгах түр хороо байгуулах тухай Улсын Их Хурлын тогтоолын төслийг батлах санал хураалт явуулъя";
  const final = finalReadingVote([
    vote("20260100212", title, "Тогтоол", name, 78, 29, "2025-07-02T10:53:00.000Z"),
    vote("20260100212", title, "Тогтоол", name, 43, 71, "2026-04-10T06:39:00.000Z"),
  ]);
  assert.deepEqual([final?.support, final?.oppose], [43, 71]);
  assert.equal(supportMajority(final!), false); // дэмжсэн нь олонх биш
});

test("эцсийн санал хураалт: олдохгүй бол null — таамаглахгүй", () => {
  const title = "Амьтны тухай хуульд нэмэлт оруулах тухай хуулийн төсөл";
  assert.equal(finalReadingVote([]), null);
  // Хэлэлцэх шатны санал хураалт эцсийнх биш
  assert.equal(finalReadingVote([vote("20250100037", title, "Хэлэлцэх эсэх", "Амьтны тухай хуульд нэмэлт оруулах тухай хуулийн төслийг батлах санал", 60, 20, "2025-05-01T02:00:00.000Z")]), null);
  // Эцсийн шатны зүйл тус бүрийн санал хураалт эцсийнх биш
  assert.equal(finalReadingVote([vote("20250100037", title, "Эцэслэн батлах", "1.Төслийн 1 дүгээр зүйлийг өөрчлөн найруулах", 60, 20, "2025-05-09T02:00:00.000Z")]), null);
});

test("дэмжсэн нь олонх: зөвхөн дэмжсэн > эсэргүүцсэн", () => {
  assert.equal(supportMajority({ support: 40, oppose: 30, total: 70 }), true);
  assert.equal(supportMajority({ support: 30, oppose: 30, total: 60 }), false);
  assert.equal(supportMajority({ support: 10, oppose: 30, total: 40 }), false);
});
