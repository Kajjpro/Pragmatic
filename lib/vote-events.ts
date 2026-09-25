// Санал хураалтын таамгийн тоглоом: ParliamentAPI → VoteEvent (sync) ба дүн зарлах (reveal).
// ParliamentAPI-г параметрээр авдаг тул тестэд хуурамч client өгч болно.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as parliament from "@/lib/parliament";
import type { AgendaVote } from "@/lib/parliament";
import type { VoteCounts } from "@/lib/points";
import { prisma } from "@/lib/prisma";

export type ParliamentClient = Pick<typeof parliament, "getAgendaList" | "getAgendaVoteList">;

// Dev 2-ийн бэлдсэн гарчиг, hook (AI-аар урьдчилан бичсэн — энд AI дуудахгүй)
export type VoteHook = { agendaCode: string; title: string; hook: string };

// ───────────── Dev 2-ийн өгөгдөл ─────────────

function readJson(path: string): unknown {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new Error(`${path} зөв JSON биш байна`);
  }
}

function toHook(raw: unknown): VoteHook | null {
  const r = raw as Partial<VoteHook> | null;
  if (!r || typeof r.agendaCode !== "string" || typeof r.title !== "string" || typeof r.hook !== "string") return null;
  if (!r.agendaCode.trim() || !r.hook.trim()) return null;
  return { agendaCode: r.agendaCode.trim(), title: r.title.trim(), hook: r.hook.trim() };
}

// data/vote-events.json ба data/precomputed.json-ийн voteEvents. Ижил agendaCode бол precomputed нь давамгайлна.
export function readVoteHooks(dataDir = "data"): VoteHook[] {
  const byCode = new Map<string, VoteHook>();
  const list = readJson(join(dataDir, "vote-events.json"));
  const pre = readJson(join(dataDir, "precomputed.json")) as { voteEvents?: unknown } | null;

  for (const source of [list, pre?.voteEvents]) {
    if (!Array.isArray(source)) continue;
    for (const raw of source) {
      const hook = toHook(raw);
      if (hook) byCode.set(hook.agendaCode, hook);
    }
  }
  return [...byCode.values()];
}

// ───────────── Sync ─────────────

export type SyncReport = {
  checked: number;
  created: number;
  updated: number;
  replays: number; // эцсийн санал хураалт аль хэдийн болсон
  skipped: { agendaCode: string; reason: string }[];
};

// Бидний сонирхсон хэлэлцэх асуудал бүрийн санал хураалтыг ParliamentAPI-аас татаж VoteEvent-д хадгална.
// Эцсийн хэлэлцүүлгийн санал хураалт болсон бол isReplay = true, тоо нь hidden* талбарт reveal хүртэл нууц.
// ParliamentAPI огт холбогдохгүй бол ParliamentApiError шиднэ (route → 503).
export async function syncVoteEvents(
  client: ParliamentClient = parliament,
  hooks: VoteHook[] = readVoteHooks(),
): Promise<SyncReport> {
  const report: SyncReport = { checked: 0, created: 0, updated: 0, replays: 0, skipped: [] };

  // 1. Бидний сонирхсон асуудлууд: agendaCode-той төслүүд + Dev 2-ийн жагсаалт
  const projects = await prisma.project.findMany({
    where: { agendaCode: { not: null } },
    select: { id: true, title: true, agendaCode: true },
  });
  const projectByCode = new Map(projects.map((p) => [p.agendaCode as string, p]));
  const hookByCode = new Map(hooks.map((h) => [h.agendaCode, h]));
  const codes = [...new Set([...projectByCode.keys(), ...hookByCode.keys()])];

  // 2. ParliamentAPI-д байгаа асуудлууд (энд унавал бүхэлдээ зогсоно)
  const agendas = await client.getAgendaList();
  const agendaByCode = new Map(agendas.map((a) => [a.agendaCode, a]));

  // 3. Асуудал бүрийн санал хураалт
  for (const agendaCode of codes) {
    report.checked++;
    const hook = hookByCode.get(agendaCode);
    const project = projectByCode.get(agendaCode);

    if (!agendaByCode.has(agendaCode)) {
      report.skipped.push({ agendaCode, reason: "ParliamentAPI-д ийм хэлэлцэх асуудал алга" });
      continue;
    }
    if (!hook) {
      report.skipped.push({ agendaCode, reason: "hook алга (Dev 2-ийн precomputed.json-д нэмэх)" });
      continue;
    }

    let votes: AgendaVote[];
    try {
      votes = await client.getAgendaVoteList(agendaCode);
    } catch (e) {
      report.skipped.push({ agendaCode, reason: e instanceof Error ? e.message : "санал хураалт татаж чадсангүй" });
      continue;
    }
    const final = parliament.finalReadingVote(votes);
    if (final) report.replays++;

    // Дүн гарсан (REVEALED) санал хураалтыг дахин өөрчлөхгүй
    const existing = await prisma.voteEvent.findUnique({ where: { agendaCode }, select: { status: true } });
    if (existing?.status === "REVEALED") {
      report.skipped.push({ agendaCode, reason: "дүн аль хэдийн гарсан" });
      continue;
    }

    const data = {
      title: hook.title || project?.title || agendaCode,
      hook: hook.hook,
      projectId: project?.id ?? null,
      isReplay: final !== null,
      hiddenSupport: final?.support ?? null,
      hiddenOppose: final?.oppose ?? null,
      hiddenTotal: final?.total ?? null,
    };
    await prisma.voteEvent.upsert({
      where: { agendaCode },
      create: { agendaCode, status: "OPEN", ...data },
      update: data,
    });
    if (existing) report.updated++;
    else report.created++;
  }

  return report;
}

// ───────────── Reveal-ийн тоо ─────────────

export type RevealCounts =
  | { status: "OK"; counts: VoteCounts }
  | { status: "NOT_FOUND" | "ALREADY_REVEALED" | "NOT_VOTED_YET" };

// Replay бол нууцалсан тоог, үгүй бол ParliamentAPI-аас эцсийн санал хураалтыг авна.
// ParliamentAPI холбогдохгүй бол ParliamentApiError шиднэ (route → 503).
export async function findRevealCounts(eventId: string, client: ParliamentClient = parliament): Promise<RevealCounts> {
  const event = await prisma.voteEvent.findUnique({
    where: { id: eventId },
    select: { agendaCode: true, status: true, hiddenSupport: true, hiddenOppose: true, hiddenTotal: true },
  });
  if (!event) return { status: "NOT_FOUND" };
  if (event.status === "REVEALED") return { status: "ALREADY_REVEALED" };

  if (event.hiddenSupport !== null && event.hiddenOppose !== null && event.hiddenTotal !== null) {
    return {
      status: "OK",
      counts: { support: event.hiddenSupport, oppose: event.hiddenOppose, total: event.hiddenTotal },
    };
  }

  const final = parliament.finalReadingVote(await client.getAgendaVoteList(event.agendaCode));
  if (!final) return { status: "NOT_VOTED_YET" };
  return { status: "OK", counts: { support: final.support, oppose: final.oppose, total: final.total } };
}
