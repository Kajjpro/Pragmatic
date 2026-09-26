// /api/parliament/*, /api/drafts-ийн өгөгдөл. Frontend зөвхөн эдгээр route-ыг дуудна — гадны API-г хэзээ ч шууд биш.
// DB-ээс уншина (npm run vote -- sync бөглөнө). Хүснэгт хоосон, эсвэл хараахан үүсээгүй (migration хийгээгүй) бол
// data/snapshots/-оос уншина (npm run discover). `source` аль нь болохыг хэлнэ.
// Snapshot-д байхгүй мэдээлэл null — 0 биш (тоо зохиохгүй).
// Гишүүн бүрийн саналыг (getVotingResult) хэзээ ч буцаахгүй — зөвхөн тоо (CLAUDE.md: төвийг сахих).
import type { ListQuery } from "@/lib/law/http";
import type { ProjectListItem } from "@/lib/lawforum";
import { lawforumDate, lawforumPageUrl } from "@/lib/lawforum";
import {
  finalReadingVote,
  parseAgendaList,
  parseAgendaVoteList,
  parseMeetings,
  parseMembers,
  parseVotingList,
  type AgendaVote,
  type Meeting,
  type MeetingVote,
} from "@/lib/parliament";
import { supportMajority } from "@/lib/points";
import { prisma } from "@/lib/prisma";
import { readSnapshot } from "@/lib/snapshots";

// CDN-д 5 минут хадгална — УИХ-ын өгөгдөл өдөрт цөөн өөрчлөгддөг
export const PUBLIC_CACHE = { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" };

export type Source = "db" | "snapshot";

export type List<T> = {
  source: Source;
  syncedAt: string | null; // DB: сүүлийн sync; snapshot: татсан цаг
  total: number; // шүүлтэд таарсан бүгд (limit, offset-оос өмнө)
  items: T[];
};

export type Vote = {
  customId: string;
  agendaCode: string | null;
  meetingId: number | null;
  name: string; // санал хураалтын асуулт
  voteType: string | null; // "Хэлэлцэх эсэх", "Эцэслэн батлах", ... (getVotingList-ээс бол null)
  support: number;
  oppose: number;
  total: number;
  present: number | null;
  votedAt: string | null;
};

// supportMajority = дэмжсэн > татгалзсан (lib/points.ts). Хууль батлагдах эрх зүйн дүрэм гэж бүү тайлбарла.
export type FinalVote = Vote & { supportMajority: boolean };

export type AgendaItem = {
  agendaCode: string;
  title: string;
  voteCount: number | null; // null = мэдэгдэхгүй (snapshot-д энэ асуудлын санал хураалт алга)
  lastVotedAt: string | null;
  finalVote: FinalVote | null; // эцсийн (батлах) санал хураалт — lib/parliament.ts finalReadingVote
};

export type MeetingItem = Meeting;

export type MemberItem = { key: string; name: string | null; email: string | null };

export type DraftItem = {
  id: number;
  title: string;
  projectNumber: string | null;
  typeTitle: string | null;
  categoryTitle: string | null;
  status: number | null;
  stage: number | null;
  isActive: boolean;
  publishedAt: string | null;
  url: string; // lawforum.parliament.mn дээрх хуудас
};

// ───────────── Туслах ─────────────

type Row = Record<string, unknown>;

function iso(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

function matches(q: string, ...texts: (string | null)[]): boolean {
  const needle = q.toLowerCase();
  return !needle || texts.some((t) => t?.toLowerCase().includes(needle));
}

function page<T>(items: T[], query: ListQuery): T[] {
  return items.slice(query.offset, query.offset + query.limit);
}

// Хүснэгтийн сүүлийн sync-ийн цаг. Хоосон эсвэл уншиж чадахгүй бол (migration хийгээгүй г.м.) null → snapshot.
async function lastSync(read: () => Promise<{ _max: { syncedAt: Date | null } }>): Promise<Date | null> {
  try {
    return (await read())._max.syncedAt;
  } catch (error) {
    console.error("DB-ээс уншиж чадсангүй, data/snapshots-оос уншина:", error instanceof Error ? error.message : error);
    return null;
  }
}

function fromApiVote(v: AgendaVote): Vote {
  return {
    customId: v.customId,
    agendaCode: v.agendaCode || null,
    meetingId: v.meetingId,
    name: v.name,
    voteType: v.voteType || null,
    support: v.support,
    oppose: v.oppose,
    total: v.total,
    present: v.present,
    votedAt: v.votedAt,
  };
}

function fromMeetingVote(v: MeetingVote): Vote {
  return { ...v, agendaCode: null, voteType: null, present: null, votedAt: null };
}

type DbVote = {
  customId: string;
  agendaCode: string;
  meetingId: number | null;
  name: string;
  voteType: string;
  support: number;
  oppose: number;
  total: number;
  present: number | null;
  votedAt: Date | null;
};

function fromDbVote(v: DbVote): Vote {
  return {
    customId: v.customId,
    agendaCode: v.agendaCode,
    meetingId: v.meetingId,
    name: v.name,
    voteType: v.voteType,
    support: v.support,
    oppose: v.oppose,
    total: v.total,
    present: v.present,
    votedAt: iso(v.votedAt),
  };
}

function toFinal(v: Vote): FinalVote {
  return { ...v, supportMajority: supportMajority(v) };
}

// ───────────── Хэлэлцэх асуудал ─────────────

// Snapshot: бүх асуудлын нэр (getAgendaList) + нэг л асуудлын санал хураалт (getAgendaVoteList)
function agendaSnapshot() {
  const list = readSnapshot("getAgendaList");
  const voteSnap = readSnapshot("getAgendaVoteList");
  const votes = voteSnap ? parseAgendaVoteList(voteSnap.response as Row) : [];
  return {
    fetchedAt: list?.fetchedAt ?? null,
    agendas: list ? parseAgendaList(list.response as Row) : [],
    votedCode: String(voteSnap?.params.agendaCode ?? votes[0]?.agendaCode ?? ""),
    votes,
  };
}

function snapshotAgendaItem(agenda: { agendaCode: string; title: string }, snap: ReturnType<typeof agendaSnapshot>): AgendaItem {
  if (agenda.agendaCode !== snap.votedCode) {
    return { ...agenda, voteCount: null, lastVotedAt: null, finalVote: null };
  }
  const final = finalReadingVote(snap.votes);
  return {
    ...agenda,
    voteCount: snap.votes.length,
    lastVotedAt: snap.votes.reduce<string | null>((last, v) => (v.votedAt && (!last || v.votedAt > last) ? v.votedAt : last), null),
    finalVote: final ? toFinal(fromApiVote(final)) : null,
  };
}

// Сүүлд санал хураасан нь эхэнд, санал хураалтгүй (хүлээгдэж буй) нь ард
export async function listAgendas(query: ListQuery): Promise<List<AgendaItem>> {
  const syncedAt = await lastSync(() => prisma.parliamentAgenda.aggregate({ _max: { syncedAt: true } }));

  if (!syncedAt) {
    const snap = agendaSnapshot();
    const found = snap.agendas.filter((a) => matches(query.q, a.title)).sort((a, b) => b.agendaCode.localeCompare(a.agendaCode));
    return { source: "snapshot", syncedAt: snap.fetchedAt, total: found.length, items: page(found, query).map((a) => snapshotAgendaItem(a, snap)) };
  }

  const where = query.q ? { title: { contains: query.q, mode: "insensitive" as const } } : {};
  const [total, rows] = await Promise.all([
    prisma.parliamentAgenda.count({ where }),
    prisma.parliamentAgenda.findMany({
      where,
      orderBy: [{ lastVotedAt: { sort: "desc", nulls: "last" } }, { agendaCode: "desc" }],
      skip: query.offset,
      take: query.limit,
    }),
  ]);

  // Эцсийн санал хураалтуудыг нэг хүсэлтээр
  const keys = rows.flatMap((r) => (r.finalVoteId ? [{ agendaCode: r.agendaCode, customId: r.finalVoteId }] : []));
  const finals = keys.length ? await prisma.parliamentVote.findMany({ where: { OR: keys } }) : [];
  const finalByAgenda = new Map(finals.map((v) => [v.agendaCode, toFinal(fromDbVote(v))]));

  return {
    source: "db",
    syncedAt: iso(syncedAt),
    total,
    items: rows.map((r) => ({
      agendaCode: r.agendaCode,
      title: r.title,
      voteCount: r.voteCount,
      lastVotedAt: iso(r.lastVotedAt),
      finalVote: finalByAgenda.get(r.agendaCode) ?? null,
    })),
  };
}

export type AgendaDetail = { source: Source; syncedAt: string | null; agenda: AgendaItem; votes: Vote[] | null };

// Олдохгүй бол null (→ 404). votes: цагийн дарааллаар; snapshot-д алга бол null.
export async function getAgenda(agendaCode: string): Promise<AgendaDetail | null> {
  const syncedAt = await lastSync(() => prisma.parliamentAgenda.aggregate({ _max: { syncedAt: true } }));

  if (!syncedAt) {
    const snap = agendaSnapshot();
    const agenda = snap.agendas.find((a) => a.agendaCode === agendaCode);
    if (!agenda) return null;
    const item = snapshotAgendaItem(agenda, snap);
    return { source: "snapshot", syncedAt: snap.fetchedAt, agenda: item, votes: agendaCode === snap.votedCode ? snap.votes.map(fromApiVote) : null };
  }

  const row = await prisma.parliamentAgenda.findUnique({
    where: { agendaCode },
    include: { votes: { orderBy: [{ votedAt: "asc" }, { customId: "asc" }] } },
  });
  if (!row) return null;
  const votes = row.votes.map(fromDbVote);
  const final = votes.find((v) => v.customId === row.finalVoteId);
  return {
    source: "db",
    syncedAt: iso(syncedAt),
    agenda: { agendaCode: row.agendaCode, title: row.title, voteCount: row.voteCount, lastVotedAt: iso(row.lastVotedAt), finalVote: final ? toFinal(final) : null },
    votes,
  };
}

// ───────────── Хуралдаан ─────────────

function meetingSnapshot() {
  const snap = readSnapshot("getMeetings");
  return { fetchedAt: snap?.fetchedAt ?? null, meetings: snap ? parseMeetings(snap.response as Row) : [] };
}

// Шинэ нь эхэнд
export async function listMeetings(query: ListQuery): Promise<List<MeetingItem>> {
  const syncedAt = await lastSync(() => prisma.parliamentMeeting.aggregate({ _max: { syncedAt: true } }));

  if (!syncedAt) {
    const snap = meetingSnapshot();
    const found = snap.meetings
      .filter((m) => matches(query.q, m.title, m.description))
      .sort((a, b) => (b.startsAt ?? "").localeCompare(a.startsAt ?? "") || b.id - a.id);
    return { source: "snapshot", syncedAt: snap.fetchedAt, total: found.length, items: page(found, query) };
  }

  const where = query.q
    ? { OR: [{ title: { contains: query.q, mode: "insensitive" as const } }, { description: { contains: query.q, mode: "insensitive" as const } }] }
    : {};
  const [total, rows] = await Promise.all([
    prisma.parliamentMeeting.count({ where }),
    prisma.parliamentMeeting.findMany({
      where,
      orderBy: [{ startsAt: { sort: "desc", nulls: "last" } }, { id: "desc" }],
      skip: query.offset,
      take: query.limit,
    }),
  ]);
  return {
    source: "db",
    syncedAt: iso(syncedAt),
    total,
    items: rows.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      startsAt: iso(m.startsAt),
      openedAt: iso(m.openedAt),
      endedAt: iso(m.endedAt),
    })),
  };
}

export type MeetingDetail = { source: Source; syncedAt: string | null; meeting: MeetingItem; votes: Vote[] | null };

// DB: тухайн хуралдаанд болсон, хэлэлцэх асуудалд хамаарах санал хураалтууд (давхардалгүй).
// Snapshot: getVotingList-ийн хуулбар тухайн хуралдаанынх бол, үгүй бол votes = null.
export async function getMeeting(id: number): Promise<MeetingDetail | null> {
  const syncedAt = await lastSync(() => prisma.parliamentMeeting.aggregate({ _max: { syncedAt: true } }));

  if (!syncedAt) {
    const snap = meetingSnapshot();
    const meeting = snap.meetings.find((m) => m.id === id);
    if (!meeting) return null;
    const list = readSnapshot("getVotingList");
    const votes = list && Number(list.params.meetingId) === id ? parseVotingList(list.response as Row).map(fromMeetingVote) : null;
    return { source: "snapshot", syncedAt: snap.fetchedAt, meeting, votes };
  }

  const [meeting, rows] = await Promise.all([
    prisma.parliamentMeeting.findUnique({ where: { id } }),
    prisma.parliamentVote.findMany({ where: { meetingId: id }, orderBy: [{ votedAt: "asc" }, { customId: "asc" }] }),
  ]);
  if (!meeting) return null;
  // Нэг санал хураалт хэд хэдэн асуудалд бүртгэгдсэн байж болно — нэг удаа л харуулна
  const seen = new Set<string>();
  const votes: Vote[] = [];
  for (const row of rows) {
    if (seen.has(row.customId)) continue;
    seen.add(row.customId);
    votes.push(fromDbVote(row));
  }
  return {
    source: "db",
    syncedAt: iso(syncedAt),
    meeting: {
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      startsAt: iso(meeting.startsAt),
      openedAt: iso(meeting.openedAt),
      endedAt: iso(meeting.endedAt),
    },
    votes,
  };
}

// ───────────── Гишүүд ─────────────

// API энэ эрхээр хоосон жагсаалт буцаадаг тул одоогоор items = []
export async function listMembers(query: ListQuery): Promise<List<MemberItem>> {
  const syncedAt = await lastSync(() => prisma.parliamentMember.aggregate({ _max: { syncedAt: true } }));

  if (!syncedAt) {
    const snap = readSnapshot("getMembers");
    const members = (snap ? parseMembers(snap.response as Row) : [])
      .filter((m) => matches(query.q, m.name, m.email))
      .map((m) => ({ key: m.key, name: m.name, email: m.email }));
    return { source: "snapshot", syncedAt: snap?.fetchedAt ?? null, total: members.length, items: page(members, query) };
  }

  const where = query.q ? { name: { contains: query.q, mode: "insensitive" as const } } : {};
  const [total, rows] = await Promise.all([
    prisma.parliamentMember.count({ where }),
    prisma.parliamentMember.findMany({ where, orderBy: { name: "asc" }, skip: query.offset, take: query.limit, select: { key: true, name: true, email: true } }),
  ]);
  return { source: "db", syncedAt: iso(syncedAt), total, items: rows };
}

// ───────────── LawForum-ын хуулийн төслүүд ─────────────

function draftFromApi(p: ProjectListItem): DraftItem {
  return {
    id: p.id,
    title: (p.title ?? "").replace(/\s+/g, " ").trim(),
    projectNumber: p.projectNumber,
    typeTitle: p.typeTitle,
    categoryTitle: p.categoryTitle,
    status: p.status,
    stage: p.stage,
    isActive: p.isActive,
    publishedAt: iso(lawforumDate(p.publishedOnUtc)),
    url: lawforumPageUrl(p.id),
  };
}

// Шинээр нийтэлсэн нь эхэнд. active = true бол зөвхөн идэвхтэй (санал авч буй) төсөл.
export async function listDrafts(query: ListQuery & { active: boolean }): Promise<List<DraftItem>> {
  const syncedAt = await lastSync(() => prisma.lawDraft.aggregate({ _max: { syncedAt: true } }));

  if (!syncedAt) {
    const snap = readSnapshot("lawforum-projects");
    const items = ((snap?.response as { items?: ProjectListItem[] } | undefined)?.items ?? [])
      .map(draftFromApi)
      .filter((d) => d.title && (!query.active || d.isActive) && matches(query.q, d.title, d.projectNumber))
      .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "") || b.id - a.id);
    return { source: "snapshot", syncedAt: snap?.fetchedAt ?? null, total: items.length, items: page(items, query) };
  }

  const where = {
    ...(query.active ? { isActive: true } : {}),
    ...(query.q
      ? { OR: [{ title: { contains: query.q, mode: "insensitive" as const } }, { projectNumber: { contains: query.q, mode: "insensitive" as const } }] }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.lawDraft.count({ where }),
    prisma.lawDraft.findMany({
      where,
      orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }, { id: "desc" }],
      skip: query.offset,
      take: query.limit,
    }),
  ]);
  return {
    source: "db",
    syncedAt: iso(syncedAt),
    total,
    items: rows.map((d) => ({
      id: d.id,
      title: d.title,
      projectNumber: d.projectNumber,
      typeTitle: d.typeTitle,
      categoryTitle: d.categoryTitle,
      status: d.status,
      stage: d.stage,
      isActive: d.isActive,
      publishedAt: iso(d.publishedAt),
      url: lawforumPageUrl(d.id),
    })),
  };
}
