// УИХ-ын ParliamentAPI-ийн client (хакатоны зохион байгуулагчийн API).
// .env: PARLIAMENT_API_URL (заавал), PARLIAMENT_API_KEY (шаардлагатай бол).
// Серверээс л дуудна. API унасан, удааширсан, хэлбэр нь өөр бол ParliamentApiError шиднэ —
// route нь монгол алдаа буцааж, сайт DB-ээс хэвийн ажилласаар байна.
//
// ⚠ Хариуны талбаруудын нэрийг (readAgenda, readVote доторх) API-ийн баримт бичигтэй тулгаж баталгаажуулах.

export class ParliamentApiError extends Error {}

// Хэлэлцэх асуудал (agenda)
export type Agenda = {
  agendaCode: string;
  title: string;
};

// Нэг удаагийн санал хураалтын дүн
export type AgendaVote = {
  support: number; // дэмжсэн
  oppose: number; // эсэргүүцсэн
  total: number; // санал өгсөн нийт
  isFinalReading: boolean; // эцсийн хэлэлцүүлгийн санал хураалт эсэх
  votedAt: string | null;
};

const TIMEOUT_MS = 8000; // API удаан бол хүлээхгүй

// ───────────── HTTP ─────────────

async function call(method: string, params: Record<string, string> = {}): Promise<unknown> {
  const base = process.env.PARLIAMENT_API_URL;
  if (!base) throw new ParliamentApiError("ParliamentAPI-ийн хаяг (PARLIAMENT_API_URL) тохируулаагүй байна");

  const url = new URL(`${base.replace(/\/+$/, "")}/${method}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const headers: Record<string, string> = { Accept: "application/json" };
  if (process.env.PARLIAMENT_API_KEY) headers.Authorization = `Bearer ${process.env.PARLIAMENT_API_KEY}`;

  let res: Response;
  try {
    res = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    throw new ParliamentApiError("УИХ-ын ParliamentAPI-тай холбогдож чадсангүй");
  }
  if (!res.ok) throw new ParliamentApiError(`УИХ-ын ParliamentAPI алдаа буцаалаа (${res.status})`);

  try {
    return await res.json();
  } catch {
    throw new ParliamentApiError("ParliamentAPI-ийн хариу JSON биш байна");
  }
}

// Хариу нь шууд массив эсвэл { data: [...] } хэлбэртэй байж болно
function asList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const data = (raw as { data?: unknown } | null)?.data;
  return Array.isArray(data) ? data : [];
}

function toNumber(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

// ───────────── Хариуг манай хэлбэрт хөрвүүлэх ─────────────

function readAgenda(raw: unknown): Agenda | null {
  const r = raw as Record<string, unknown>;
  const code = r?.agendaCode;
  const title = r?.title;
  if ((typeof code !== "string" && typeof code !== "number") || typeof title !== "string") return null;
  return { agendaCode: String(code), title: title.trim() };
}

function readVote(raw: unknown): AgendaVote | null {
  const r = raw as Record<string, unknown>;
  const support = toNumber(r?.support);
  const oppose = toNumber(r?.oppose);
  const total = toNumber(r?.total);
  if (support === null || oppose === null || total === null) return null;
  return {
    support,
    oppose,
    total,
    isFinalReading: r.isFinalReading === true,
    votedAt: typeof r.votedAt === "string" ? r.votedAt : null,
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
  return readAll(asList(await call("getAgendaVoteList", { agendaCode })), readVote, "getAgendaVoteList");
}

// Эцсийн хэлэлцүүлгийн санал хураалт (хэд байвал хамгийн сүүлийнх). Болоогүй бол null.
export function finalReadingVote(votes: AgendaVote[]): AgendaVote | null {
  const finals = votes.filter((v) => v.isFinalReading);
  return finals.length > 0 ? finals[finals.length - 1] : null;
}
