// УИХ-ын ParliamentAPI-ийн client. Зөвхөн серверээс дуудна (нэвтрэх нэр, нууц үг хөтөч рүү хэзээ ч гарахгүй).
//
// .env: PARLIAMENT_API_URL, PARLIAMENT_API_USER, PARLIAMENT_API_PASS (хакатоны зохион байгуулагчаас; кодонд хэзээ ч бичихгүй)
//
// Хэрхэн ажилладаг вэ (2026-09-26-нд бодит API дээр шалгасан):
//   1. POST {URL}/api/login {"username","password"}
//      → { access_token, token_type: "Bearer", expires_in: 21600 } + Set-Cookie: JSESSIONID=...
//   2. POST {URL}/ParliamentService (хурал, санал хураалт) эсвэл {URL}/Service (тайлан), body {"func": "...", ...}
//      Header: Authorization: Bearer <token> БА Cookie: JSESSIONID=... — ХОЁУЛАА хэрэгтэй.
//      Token нь сервер дээрх сесстэй холбоотой: cookie-гүй бол 401 {"ok":false,"msg":"token buruu"}.
//   3. Token-ийг санах ойд хадгалж, дуусахаас 5 минутын өмнө шинэчилнэ. 401 ирвэл дахин нэвтэрч НЭГ удаа давтана.
//
// Алдааг API ихэвчлэн HTTP 200-аар буцаадаг:
//   { ok: false, error: "parameter dutuu" }  эсвэл  { success: false, message: "Agenda code буруу байна." }
// Бүх алдаа ParliamentApiError болно — route нь монгол алдаа буцааж, сайт DB-ээс хэвийн ажилласаар байна.
//
// Хариуны бүтэн жишээ: data/snapshots/*.json (npm run discover)

import "server-only";

export class ParliamentApiError extends Error {}

// ───────────── Төрлүүд ─────────────

// Хэлэлцэх асуудал (getAgendaList → { agendaCode, agendaName })
export type Agenda = {
  agendaCode: string; // 11 оронтой: он + чуулган + дугаар
  title: string;
};

// Нэг санал хураалт (getAgendaVoteList). Зөвхөн тоо — хэн яаж саналаа өгсөн нь энд байхгүй.
export type AgendaVote = {
  customId: string; // "549_202512310038117" = хуралдааны id + санал хураалтын дугаар (getVotingResult-ийн voteid)
  agendaCode: string;
  agendaTitle: string;
  meetingId: number | null; // MeetingID
  name: string; // санал хураалтын асуулт: "...төслийг эцэслэн батлах санал хураалт явуулъя."
  voteType: string; // "Хэлэлцэх эсэх", "Зарчимын зөрүүтэй санал", "Эцэслэн батлах", "Тогтоол", ...
  support: number; // zovshooron — зөвшөөрсөн
  oppose: number; // tatgalzsan — татгалзсан
  total: number; // niit — санал өгсөн нийт (= support + oppose)
  present: number | null; // irts — ирц
  votedAt: string | null; // ISO (API Улаанбаатарын цагаар өгдөг)
};

// Хуралдаан (getMeetings)
export type Meeting = {
  id: number;
  title: string; // "ЧУУЛГАНЫ НЭГДСЭН ХУРАЛДААН"
  description: string | null; // "УЛСЫН ИХ ХУРЛЫН 2026 ОНЫ ... НЭГДСЭН ХУРАЛДААН"
  startsAt: string | null; // start — товлосон цаг
  openedAt: string | null; // startmeeting — хуралдаан нээгдсэн цаг
  endedAt: string | null; // ended
};

// Хуралдааны санал хураалт (getVotingList) — хэлэлцэх асуудлын код, төрөлгүй, зөвхөн тоо
export type MeetingVote = {
  customId: string;
  meetingId: number | null;
  name: string;
  support: number;
  oppose: number;
  total: number;
};

// Гишүүн бүрийн санал (getVotingResult).
// ⚠ Нийтэд ХАРУУЛАХГҮЙ, DB-д хадгалахгүй: CLAUDE.md — гишүүдийг эрэмбэлэх, магтах, шүүмжлэхгүй; зөвхөн тоо.
export type MemberBallot = {
  member: string; // "Алдаржавхлан.Ж"
  result: string; // "Зөвшөөрсөн" | "Татгалзсан"
  voted: boolean;
  votedAt: string | null;
};

// УИХ-ын гишүүн (getMembers). Энэ эрхээр API хоосон жагсаалт буцаадаг тул мөрийн хэлбэр баталгаагүй:
// нэр, имэйлийг олдвол авч, анхны мөрийг data-д бүтнээр нь хадгална.
export type Member = {
  key: string; // имэйл → id → нэр (эхний олдсон нь)
  name: string | null;
  email: string | null;
  data: Record<string, unknown>;
};

// ───────────── HTTP, нэвтрэлт ─────────────

const TIMEOUT_MS = 20_000; // API ачаалалтай үед нэг дуудлага ~1 сек
const REFRESH_EARLY_MS = 5 * 60 * 1000; // token дуусахаас 5 минутын өмнө шинэчилнэ
const TEST_MEETING = "Тест хурал"; // API-д туршилтын хуралдааны өгөгдөл холилдсон — хэзээ ч гаргахгүй

// key = хаяг + хэрэглэгч: өөр сервер, өөр бүртгэлд хуучин сессийг хэрэглэхгүй
type Session = { key: string; token: string; cookie: string; expiresAt: number };
let session: Session | null = null;
let loggingIn: Promise<Session> | null = null;

function config() {
  const url = process.env.PARLIAMENT_API_URL?.trim().replace(/\/+$/, "");
  const username = process.env.PARLIAMENT_API_USER;
  const password = process.env.PARLIAMENT_API_PASS;
  if (!url || !username || !password) {
    throw new ParliamentApiError(
      "ParliamentAPI тохируулаагүй байна (.env: PARLIAMENT_API_URL, PARLIAMENT_API_USER, PARLIAMENT_API_PASS)",
    );
  }
  return { url, username, password };
}

async function post(url: string, body: unknown, headers: Record<string, string> = {}): Promise<Response> {
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...headers },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new ParliamentApiError("УИХ-ын ParliamentAPI-тай холбогдож чадсангүй");
  }
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new ParliamentApiError("ParliamentAPI-ийн хариу JSON биш байна");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ParliamentApiError("ParliamentAPI-ийн хариуны хэлбэр танигдсангүй");
  }
  return body as Record<string, unknown>;
}

async function login(): Promise<Session> {
  const { url, username, password } = config();
  const res = await post(`${url}/api/login`, { username, password });
  if (res.status === 400 || res.status === 401) {
    throw new ParliamentApiError("ParliamentAPI-д нэвтэрч чадсангүй — PARLIAMENT_API_USER, PARLIAMENT_API_PASS-ийг шалгана уу");
  }
  if (!res.ok) throw new ParliamentApiError(`ParliamentAPI-д нэвтрэхэд алдаа гарлаа (${res.status})`);

  const body = await readJson(res);
  if (typeof body.access_token !== "string" || !body.access_token) {
    throw new ParliamentApiError("ParliamentAPI-ийн нэвтрэлтийн хариунд token алга");
  }
  // Token нь JSESSIONID сесстэй холбоотой — cookie-г хадгалж дуудлага бүрт хамт явуулна
  const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0].trim())
    .filter(Boolean)
    .join("; ");
  const seconds = typeof body.expires_in === "number" && body.expires_in > 0 ? body.expires_in : 6 * 60 * 60;
  return { key: `${url} ${username}`, token: body.access_token, cookie, expiresAt: Date.now() + seconds * 1000 - REFRESH_EARLY_MS };
}

// Хүчинтэй сесс. `rejected` = 401 авсан сесс: одоогийнх нь тэр хэвээр бол дахин нэвтэрнэ.
// Зэрэг олон дуудлага 401 авсан ч нэг л удаа нэвтэрнэ.
async function getSession(rejected?: Session): Promise<Session> {
  const { url, username } = config();
  const key = `${url} ${username}`;
  if (session && session.key === key && session !== rejected && Date.now() < session.expiresAt) return session;
  loggingIn ??= login()
    .then((created) => (session = created))
    .finally(() => {
      loggingIn = null;
    });
  return loggingIn;
}

// Нэвтэрч чадаж байгаа эсэх (scripts/discover-apis.ts). Token-ийг гадагш гаргахгүй.
export async function checkLogin(): Promise<{ expiresAt: Date; hasSessionCookie: boolean }> {
  const s = await getSession();
  return { expiresAt: new Date(s.expiresAt + REFRESH_EARLY_MS), hasSessionCookie: s.cookie.includes("JSESSIONID=") };
}

export type ParliamentService = "ParliamentService" | "Service";

// Нэг функц дуудаж хариуг ТҮҮХИЙГЭЭР нь буцаана (scripts/discover-apis.ts snapshot-д хадгалдаг).
// Бусад газар доорх getAgendaList гэх мэт функцуудыг хэрэглэнэ.
export async function callRaw(
  service: ParliamentService,
  func: string,
  params: Record<string, string | number> = {},
): Promise<Record<string, unknown>> {
  const { url } = config();
  const send = (s: Session) =>
    post(`${url}/${service}`, { func, ...params }, { Authorization: `Bearer ${s.token}`, ...(s.cookie ? { Cookie: s.cookie } : {}) });

  let current = await getSession();
  let res = await send(current);
  if (res.status === 401) {
    // Token-ийн хугацаа дууссан эсвэл сесс хаагдсан → дахин нэвтэрч нэг удаа давтана
    current = await getSession(current);
    res = await send(current);
  }
  if (res.status === 401) throw new ParliamentApiError("ParliamentAPI token-ийг хүлээн авсангүй (401)");
  if (!res.ok) throw new ParliamentApiError(`УИХ-ын ParliamentAPI алдаа буцаалаа (${res.status})`);

  const body = await readJson(res);
  if (body.ok === false || body.okay === false || body.success === false) {
    const reason = [body.error, body.message, body.msg].find((m) => typeof m === "string" && m) ?? "тодорхойгүй алдаа";
    throw new ParliamentApiError(`ParliamentAPI ${func}: ${reason}`);
  }
  return body;
}

// ───────────── Хариуг манай хэлбэрт хөрвүүлэх ─────────────
// Эдгээрийг data/snapshots/-ийн түүхий хариунд ч хэрэглэнэ (lib/parliament-data.ts).

type Row = Record<string, unknown>;

// { data: [...] } — ParliamentService
function dataRows(body: Row, func: string): Row[] {
  if (!Array.isArray(body.data)) throw new ParliamentApiError(`ParliamentAPI-ийн ${func} хариуны хэлбэр танигдсангүй`);
  return body.data.filter((r): r is Row => !!r && typeof r === "object");
}

// { res: { members: [...] } } — Service
function resRows(body: Row, key: string, func: string): Row[] {
  const list = (body.res as Row | undefined)?.[key];
  if (!Array.isArray(list)) throw new ParliamentApiError(`ParliamentAPI-ийн ${func} хариуны хэлбэр танигдсангүй`);
  return list.filter((r): r is Row => !!r && typeof r === "object");
}

// Жагсаалт хоосон биш мөртлөө нэг ч мөр танигдаагүй бол хэлбэр өөрчлөгдсөн гэсэн үг — чимээгүй 0 буцаахгүй
function readAll<T>(rows: Row[], read: (row: Row) => T | null, func: string): T[] {
  const items = rows.map(read).filter((x): x is T => x !== null);
  if (rows.length > 0 && items.length === 0) {
    throw new ParliamentApiError(`ParliamentAPI-ийн ${func} хариуны хэлбэр танигдсангүй`);
  }
  return items;
}

// Илүү зай, мөр шилжилт, эхний цэгийг (".Аж ахуйн ...") арилгана
function cleanText(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").replace(/^[.\s]+/, "").trim() : "";
}

function toCount(value: unknown): number | null {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof n === "number" && Number.isInteger(n) && n >= 0 ? n : null;
}

// "2025.12.31 11:13" эсвэл "2026-09-07 10:02:39.403" → ISO. API Улаанбаатарын цагаар (+08:00) өгдөг.
function toIso(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = value.trim().match(/^(\d{4})[.-](\d{2})[.-](\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/);
  if (!m) return null;
  const [, y, mo, d, h = "00", mi = "00", s = "00", ms = "0"] = m;
  const date = new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}.${ms.padEnd(3, "0")}+08:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function readAgenda(r: Row): Agenda | null {
  const code = typeof r.agendaCode === "number" ? String(r.agendaCode) : cleanText(r.agendaCode);
  const title = cleanText(r.agendaName);
  return code && title ? { agendaCode: code, title } : null;
}

function readAgendaVote(r: Row): AgendaVote | null {
  const customId = cleanText(r.customId);
  const support = toCount(r.zovshooron);
  const oppose = toCount(r.tatgalzsan);
  const total = toCount(r.niit);
  if (!customId || support === null || oppose === null || total === null) return null;
  return {
    customId,
    agendaCode: typeof r.agendaCode === "number" ? String(r.agendaCode) : cleanText(r.agendaCode),
    agendaTitle: cleanText(r.agendaName),
    meetingId: toCount(r.MeetingID),
    name: cleanText(r.name),
    voteType: cleanText(r.voteType),
    support,
    oppose,
    total,
    present: toCount(r.irts),
    votedAt: toIso(r.votingdate),
  };
}

function readMeeting(r: Row): Meeting | null {
  const id = toCount(r.id);
  const title = cleanText(r.title);
  if (id === null || !title) return null;
  return {
    id,
    title,
    description: cleanText(r.description) || null,
    startsAt: toIso(r.start),
    openedAt: toIso(r.startmeeting),
    endedAt: toIso(r.ended),
  };
}

function readMeetingVote(r: Row): MeetingVote | null {
  const customId = cleanText(r.customId);
  const support = toCount(r.zovshooron);
  const oppose = toCount(r.tatgalzsan);
  const total = toCount(r.niit);
  if (!customId || support === null || oppose === null || total === null) return null;
  // customId-ийн эхний хэсэг нь хуралдааны id: "549_202512310038117"
  return { customId, meetingId: toCount(Number(customId.split("_")[0])), name: cleanText(r.name), support, oppose, total };
}

function readBallot(r: Row): MemberBallot | null {
  const member = cleanText(r.middleName);
  const result = cleanText(r.voteResult);
  if (!member || !result) return null;
  return { member, result, voted: r.voted === 1 || r.voted === true, votedAt: toIso(r.date) };
}

function readMember(r: Row): Member | null {
  const email = cleanText(r.email) || null;
  const id = typeof r.id === "number" ? String(r.id) : cleanText(r.id) || null;
  const name = [r.name, r.fullName, r.fullname, r.middleName, r.firstName].map(cleanText).find(Boolean) || null;
  const key = email ?? id ?? name;
  return key ? { key, name, email, data: r } : null;
}

export function parseAgendaList(body: Row): Agenda[] {
  return readAll(dataRows(body, "getAgendaList"), readAgenda, "getAgendaList");
}

export function parseAgendaVoteList(body: Row): AgendaVote[] {
  const rows = dataRows(body, "getAgendaVoteList").filter((r) => r.khorooName !== TEST_MEETING);
  return readAll(rows, readAgendaVote, "getAgendaVoteList");
}

export function parseMeetings(body: Row): Meeting[] {
  const rows = dataRows(body, "getMeetings").filter((r) => r.title !== TEST_MEETING);
  return readAll(rows, readMeeting, "getMeetings");
}

export function parseVotingList(body: Row): MeetingVote[] {
  return readAll(dataRows(body, "getVotingList"), readMeetingVote, "getVotingList");
}

export function parseVotingResult(body: Row): MemberBallot[] {
  return readAll(dataRows(body, "getVotingResult"), readBallot, "getVotingResult");
}

export function parseMembers(body: Row): Member[] {
  return readAll(resRows(body, "members", "getMembers"), readMember, "getMembers");
}

// ───────────── Функц бүр ─────────────

export async function getAgendaList(): Promise<Agenda[]> {
  return parseAgendaList(await callRaw("ParliamentService", "getAgendaList"));
}

// API нь санал хураалтуудыг цагийн дарааллаар (эртнээс) өгдөг — finalReadingVote үүнд тулгуурлана
export async function getAgendaVoteList(agendaCode: string): Promise<AgendaVote[]> {
  return parseAgendaVoteList(await callRaw("ParliamentService", "getAgendaVoteList", { agendaCode }));
}

// d1, d2: "2026-08-01" хэлбэрийн огноо
export async function getMeetings(d1: string, d2: string): Promise<Meeting[]> {
  return parseMeetings(await callRaw("ParliamentService", "getMeetings", { d1, d2 }));
}

export async function getVotingList(meetingId: number): Promise<MeetingVote[]> {
  return parseVotingList(await callRaw("ParliamentService", "getVotingList", { meetingId }));
}

// voteid = getVotingList-ийн customId БҮТНЭЭРЭЭ ("549_202512310038117"); зөвхөн сүүлийн хэсэг нь хоосон буцаадаг
export async function getVotingResult(meetingId: number, voteid: string): Promise<MemberBallot[]> {
  return parseVotingResult(await callRaw("ParliamentService", "getVotingResult", { meetingId, voteid }));
}

export async function getMembers(): Promise<Member[]> {
  return parseMembers(await callRaw("Service", "getMembers"));
}

// Байнгын хороод. Энэ эрхээр хоосон ирдэг тул хэлбэр нь тодорхойгүй — мөрийг түүхийгээр нь буцаана.
export async function getBH(): Promise<Row[]> {
  return resRows(await callRaw("Service", "getBH"), "bhs", "getBH");
}

// ───────────── Эцсийн (батлах) санал хураалт ─────────────
// voteType "Эцэслэн батлах" нь нэг санал хураалт биш, эцсийн хэлэлцүүлгийн ҮЕ ШАТ: дотор нь зүйл тус бүрийн санал,
// горимын санал, дахин санал хураалт бүгд орно. Мөн API нэг асуудалд хамт өргөн мэдүүлсэн бусад төслийн, заримдаа
// ижил нэртэй хуучин асуудлын санал хураалтыг хамт буцаадаг. Тиймээс дараах бүгдийг хангасан ЭХНИЙ санал хураалтыг авна:
//   1. эцсийн шатных (Эцэслэн батлах, Тогтоол, Соёрхон батлах) бөгөөд "...төслийг (эцэслэн) батлах / баталъя" гэсэн,
//   2. горимын санал биш,
//   3. асуудлын нэр санал хураалтын текстэд орсон (хамт өргөн мэдүүлсэн өөр төслийнх биш),
//   4. асуудлын кодын оноос (эхний 4 орон) өмнө болоогүй.
// Дараа нь "дахин" санал хураасан бол сүүлийнхийг авна. Олдохгүй бол null — таамаглахгүй.
// ⚠ Ерөнхий нэртэй тогтоолд ("Засгийн газарт чиглэл өгөх тухай") андуурч болзошгүй — тоглоомд оруулахын өмнө name-ийг шалгана.
const FINAL_STAGES = ["Эцэслэн батлах", "Тогтоол", "Соёрхон батлах"];
const APPROVAL = /төслийг (эцэслэн )?(батлах|баталъя)/;
const UB_OFFSET_MS = 8 * 60 * 60 * 1000;

function comparable(text: string): string {
  return text.toLowerCase().replace(/[“”"«»„.]/g, " ").replace(/\s+/g, " ").trim();
}

export function finalReadingVote(votes: AgendaVote[]): AgendaVote | null {
  let final: AgendaVote | null = null;
  for (const vote of votes) {
    if (!FINAL_STAGES.includes(vote.voteType)) continue;

    const name = comparable(vote.name);
    if (!APPROVAL.test(name) || name.includes("горим")) continue;

    const title = comparable(vote.agendaTitle).slice(0, 30);
    if (!title || !name.includes(title)) continue;

    const agendaYear = Number(vote.agendaCode.slice(0, 4));
    const votedYear = vote.votedAt ? new Date(Date.parse(vote.votedAt) + UB_OFFSET_MS).getUTCFullYear() : null;
    if (votedYear !== null && votedYear < agendaYear) continue;

    if (final === null || name.includes("дахин")) final = vote;
  }
  return final;
}
