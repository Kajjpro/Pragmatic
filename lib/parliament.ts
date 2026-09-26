// УИХ-ын ParliamentAPI-ийн client (хакатоны зохион байгуулагчийн API).
// Баримт: http://202.21.104.13/ParliamentAPI/docs/
// .env: PARLIAMENT_API_USER, PARLIAMENT_API_PASS (заавал), PARLIAMENT_API_BASE (анхдагч доор).
//
// Протокол:
//   1. POST /api/login { username, password } → { ok, access_token, expires_in }
//   2. Өгөгдлийн бүх хүсэлт: POST /ParliamentService { func, ... } + "Authorization: Bearer <token>"
//
// Серверээс л дуудна. API унасан, удааширсан, хэлбэр нь өөр бол ParliamentApiError шиднэ —
// route нь монгол алдаа буцааж, сайт DB-ээс хэвийн ажилласаар байна.
// Амжилттай хариуг data/snapshots/-д хадгална; дараа нь API унавал тэр хуулбарыг ашиглана (демо тасрахгүй).

import "server-only"; // зөвхөн серверээс (нууц үг хөтөч рүү гарахгүй)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export class ParliamentApiError extends Error {}

// Хэлэлцэх асуудал (agenda)
export type Agenda = {
  agendaCode: string; // яг 11 цифр, жишээ нь "20250200075"
  title: string;
};

// Нэг удаагийн санал хураалтын дүн
export type AgendaVote = {
  support: number; // дэмжсэн (zovshooron)
  oppose: number; // татгалзсан (tatgalzsan)
  total: number; // санал өгсөн нийт (niit)
  isFinalReading: boolean; // эцсийн хэлэлцүүлгийн санал хураалт эсэх (voteType-оос)
  votedAt: string | null;
};

const DEFAULT_BASE = "http://202.21.104.13/ParliamentAPI"; // "P" том үсэг — зам нь том жижиг үсгийг ялгадаг
const TIMEOUT_MS = 8000; // API удаан бол хүлээхгүй

// ───────────── Нэвтрэх (token) ─────────────

type TokenCache = { token: string; expiresAt: number };
let tokenCache: TokenCache | null = null;
let loginPromise: Promise<string> | null = null;

function baseUrl(): string {
  return (process.env.PARLIAMENT_API_BASE || DEFAULT_BASE).replace(/\/+$/, "");
}

// Сүлжээний алдааг монгол ParliamentApiError болгоно
async function send(url: string, body: unknown, token?: string): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json; charset=UTF-8" };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    return await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new ParliamentApiError("УИХ-ын ParliamentAPI-тай холбогдож чадсангүй");
  }
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    throw new ParliamentApiError("ParliamentAPI-ийн хариу JSON биш байна");
  }
}

async function login(): Promise<string> {
  const username = process.env.PARLIAMENT_API_USER;
  const password = process.env.PARLIAMENT_API_PASS;
  if (!username || !password) {
    throw new ParliamentApiError("ParliamentAPI-ийн нэвтрэх нэр, нууц үг (PARLIAMENT_API_USER, PARLIAMENT_API_PASS) тохируулаагүй байна");
  }

  const res = await send(`${baseUrl()}/api/login`, { username, password });
  if (!res.ok) throw new ParliamentApiError(`ParliamentAPI-д нэвтэрч чадсангүй (${res.status})`);

  const data = (await readJson(res)) as { ok?: boolean; access_token?: string; expires_in?: number } | null;
  if (!data?.ok || !data.access_token) throw new ParliamentApiError("ParliamentAPI нэвтрэх token өгсөнгүй");

  tokenCache = {
    token: data.access_token,
    // 6 цаг (21600 сек) дуусахаас 5 минутын өмнө шинэчилнэ
    expiresAt: Date.now() + ((data.expires_in ?? 21600) - 300) * 1000,
  };
  return tokenCache.token;
}

// Хадгалсан token хүчинтэй бол түүнийг, үгүй бол шинээр нэвтэрнэ
async function getToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.token;
  // Олон хүсэлт зэрэг ирвэл нэг л удаа нэвтэрнэ
  if (!loginPromise) {
    loginPromise = login().finally(() => {
      loginPromise = null;
    });
  }
  return loginPromise;
}

// Тестэд token-ийг цэвэрлэх
export function resetParliamentToken() {
  tokenCache = null;
  loginPromise = null;
}

// ───────────── Snapshot (демо нөөц) ─────────────

// Тест өөр хавтас өгч болно (PARLIAMENT_SNAPSHOT_DIR)
function snapshotDir(): string {
  return process.env.PARLIAMENT_SNAPSHOT_DIR || join(process.cwd(), "data", "snapshots");
}

function snapshotPath(name: string): string {
  return join(snapshotDir(), `${name.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`);
}

function saveSnapshot(name: string, data: unknown) {
  try {
    mkdirSync(snapshotDir(), { recursive: true });
    writeFileSync(snapshotPath(name), JSON.stringify(data, null, 2) + "\n", "utf8");
  } catch {
    // Vercel дээр файл бичих эрхгүй — алгасна
  }
}

function loadSnapshot(name: string): unknown {
  const path = snapshotPath(name);
  if (!existsSync(path)) return undefined;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return undefined;
  }
}

// ───────────── HTTP ─────────────

// POST /ParliamentService { func, ...params }. 401 бол дахин нэвтэрч нэг удаа давтана.
async function callLive(func: string, params: Record<string, unknown>): Promise<unknown> {
  const url = `${baseUrl()}/ParliamentService`;
  const body = { func, ...params };

  let res = await send(url, body, await getToken());
  if (res.status === 401) res = await send(url, body, await getToken(true));
  if (!res.ok) throw new ParliamentApiError(`УИХ-ын ParliamentAPI алдаа буцаалаа (${res.status})`);
  return readJson(res);
}

// Амжилттай бол snapshot хадгална; API унавал хадгалсан snapshot-ыг буцаана.
async function call(func: string, params: Record<string, unknown> = {}, snapshotName = func): Promise<unknown> {
  try {
    const data = await callLive(func, params);
    saveSnapshot(snapshotName, data);
    return data;
  } catch (e) {
    const saved = loadSnapshot(snapshotName);
    if (saved !== undefined) {
      console.warn(`ParliamentAPI ${func}: ${e instanceof Error ? e.message : e} → data/snapshots-оос уншлаа`);
      return saved;
    }
    throw e;
  }
}

// Хариу нь { data: [...] } эсвэл шууд массив байж болно
function asList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const data = (raw as { data?: unknown } | null)?.data;
  return Array.isArray(data) ? data : [];
}

function toNumber(v: unknown): number | null {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

// ───────────── Хариуг манай хэлбэрт хөрвүүлэх ─────────────

// { agendaCode, agendaName }
function readAgenda(raw: unknown): Agenda | null {
  const r = raw as Record<string, unknown> | null;
  const code = r?.agendaCode;
  const name = r?.agendaName ?? r?.title;
  if ((typeof code !== "string" && typeof code !== "number") || typeof name !== "string" || !name.trim()) return null;
  return { agendaCode: String(code).trim(), title: name.trim() };
}

// voteType-ийн текстээс эцсийн хэлэлцүүлэг эсэхийг танина ("Эцсийн хэлэлцүүлэг", "Эцэслэн батлах" гэх мэт)
const FINAL_VOTE = /эцсийн|эцэслэн/i;

// { MeetingID, zovshooron, tatgalzsan, niit, customId, voteType }
function readVote(raw: unknown): AgendaVote | null {
  const r = raw as Record<string, unknown> | null;
  const support = toNumber(r?.zovshooron);
  const oppose = toNumber(r?.tatgalzsan);
  const total = toNumber(r?.niit);
  if (support === null || oppose === null || total === null) return null;
  const voteType = typeof r?.voteType === "string" ? r.voteType : "";
  return {
    support,
    oppose,
    total,
    isFinalReading: FINAL_VOTE.test(voteType),
    votedAt: null,
  };
}

// Жагсаалт хоосон биш мөртлөө нэг ч мөр танигдаагүй бол хэлбэр өөр гэсэн үг — чимээгүй 0 буцаахгүй
function readAll<T>(list: unknown[], read: (raw: unknown) => T | null, what: string): T[] {
  const items = list.map(read).filter((x): x is T => x !== null);
  if (list.length > 0 && items.length === 0) {
    throw new ParliamentApiError(`ParliamentAPI-ийн ${what} хариуны хэлбэр танигдсангүй`);
  }
  return items;
}

// ───────────── Нийтийн функцууд ─────────────

export async function getAgendaList(): Promise<Agenda[]> {
  return readAll(asList(await call("getAgendaList")), readAgenda, "getAgendaList");
}

export async function getAgendaVoteList(agendaCode: string): Promise<AgendaVote[]> {
  const raw = await call("getAgendaVoteList", { agendaCode }, `getAgendaVoteList-${agendaCode}`);
  return readAll(asList(raw), readVote, "getAgendaVoteList");
}

// Эцсийн хэлэлцүүлгийн санал хураалт (хэд байвал хамгийн сүүлийнх). Болоогүй бол null.
export function finalReadingVote(votes: AgendaVote[]): AgendaVote | null {
  const finals = votes.filter((v) => v.isFinalReading);
  return finals.length > 0 ? finals[finals.length - 1] : null;
}
