// УИХ-ын ParliamentAPI ба LawForum-ын өгөгдлийг манай DB руу хуулна: npm run vote -- sync
//   хэлэлцэх асуудал + санал хураалт → ParliamentAgenda, ParliamentVote
//   хуралдаан → ParliamentMeeting, гишүүд → ParliamentMember, LawForum-ын бүх төсөл → LawDraft
// Бүгд upsert (байхгүй бол нэмнэ, байгаа бол шинэчилнэ): дахин ажиллуулахад давхардахгүй. Юу ч устгахгүй. AI дуудахгүй.
// Гишүүн бүрийн саналыг (getVotingResult) хадгалахгүй — зөвхөн тоо (CLAUDE.md: төвийг сахих).
// API-уудыг параметрээр авдаг тул тестэд хуурамч client өгч болно.
import * as lawforum from "@/lib/lawforum";
import { lawforumDate, type ProjectListItem } from "@/lib/lawforum";
import * as parliament from "@/lib/parliament";
import { finalReadingVote, type Agenda, type AgendaVote } from "@/lib/parliament";
import { prisma } from "@/lib/prisma";

export type ParliamentSource = Pick<typeof parliament, "getAgendaList" | "getAgendaVoteList" | "getMeetings" | "getMembers">;
export type LawforumSource = Pick<typeof lawforum, "getAllProjects">;

const API_CONCURRENCY = 4; // ParliamentAPI-г хакатоны бүх баг хэрэглэдэг — цөөн зэрэгцээ хүсэлт
const DB_CONCURRENCY = 4; // lib/prisma.ts-ийн холболтын тооноос (анхдагч 5) бага

// items-ийг `limit` зэрэгцээгээр боловсруулна. work нь өөрөө алдаагаа барина.
async function eachLimit<T>(items: T[], limit: number, work: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) await work(items[next++]);
  });
  await Promise.all(workers);
}

// Шинэ мөрийн бүх талбар DB-д байгаатай ижил эсэх (огноог цагаар нь харьцуулна).
// Өөрчлөгдөөгүй мөрийг дахин бичихгүй — DB рүү нэг хүсэлт ~100 мс.
function unchanged(saved: Record<string, unknown>, fresh: Record<string, unknown>): boolean {
  const value = (v: unknown) => (v instanceof Date ? v.getTime() : v);
  return Object.keys(fresh).every((key) => value(saved[key]) === value(fresh[key]));
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// ───────────── Хэлэлцэх асуудал + санал хураалт ─────────────

export type AgendaSyncReport = {
  agendas: number; // хадгалсан асуудал
  votes: number; // хадгалсан санал хураалтын мөр
  newVotes: number; // үүнээс шинээр нэмэгдсэн
  withFinalVote: number; // эцсийн (батлах) санал хураалт нь олдсон асуудал
  failed: { agendaCode: string; reason: string }[];
};

function voteRow(v: AgendaVote) {
  return {
    meetingId: v.meetingId,
    name: v.name,
    voteType: v.voteType,
    support: v.support,
    oppose: v.oppose,
    total: v.total,
    present: v.present,
    votedAt: v.votedAt ? new Date(v.votedAt) : null,
  };
}

// Нэг асуудлын санал хураалтууд: шинийг нэг хүсэлтээр нэмж (createMany), өөрчлөгдсөнийг л шинэчилнэ.
// Дахин ажиллуулахад ихэвчлэн ганц уншилт л болно. Буцаах утга = шинээр нэмсэн тоо.
async function saveVotes(agendaCode: string, votes: AgendaVote[]): Promise<number> {
  const saved = await prisma.parliamentVote.findMany({ where: { agendaCode } });
  const savedById = new Map(saved.map((row) => [row.customId, row]));

  const fresh = votes.filter((v) => !savedById.has(v.customId));
  if (fresh.length > 0) {
    await prisma.parliamentVote.createMany({
      data: fresh.map((v) => ({ agendaCode, customId: v.customId, ...voteRow(v) })),
      skipDuplicates: true, // API нэг жагсаалтад ижил санал хураалтыг давтаж өгвөл
    });
  }
  for (const v of votes) {
    const old = savedById.get(v.customId);
    const row = voteRow(v);
    if (old && !unchanged(old, row)) {
      await prisma.parliamentVote.update({ where: { agendaCode_customId: { agendaCode, customId: v.customId } }, data: row });
    }
  }
  return fresh.length;
}

async function saveAgenda(agenda: Agenda, votes: AgendaVote[]): Promise<{ newVotes: number; hasFinal: boolean }> {
  const final = finalReadingVote(votes);
  const lastVotedAt = votes.reduce<string | null>((last, v) => (v.votedAt && (!last || v.votedAt > last) ? v.votedAt : last), null);
  const data = {
    title: agenda.title,
    voteCount: votes.length,
    lastVotedAt: lastVotedAt ? new Date(lastVotedAt) : null,
    finalVoteId: final?.customId ?? null,
  };
  // Санал хураалт асуудал руу заадаг тул асуудлыг эхэлж хадгална
  await prisma.parliamentAgenda.upsert({
    where: { agendaCode: agenda.agendaCode },
    create: { agendaCode: agenda.agendaCode, ...data },
    update: data,
  });
  return { newVotes: await saveVotes(agenda.agendaCode, votes), hasFinal: final !== null };
}

// Бүх асуудал, тус бүрийн санал хураалт (~420 асуудал, 4 зэрэгцээгээр 1–2 минут).
// getAgendaList унавал бүхэлдээ зогсоно (ParliamentApiError). Нэг асуудлын санал хураалт татагдахгүй бол
// нэрийг нь л шинэчилж, хуучин санал хураалтыг хэвээр үлдээгээд үргэлжилнэ.
export async function syncAgendas(
  client: ParliamentSource = parliament,
  onProgress?: (done: number, total: number) => void,
): Promise<AgendaSyncReport> {
  const agendas = await client.getAgendaList();
  const report: AgendaSyncReport = { agendas: 0, votes: 0, newVotes: 0, withFinalVote: 0, failed: [] };
  let done = 0;

  await eachLimit(agendas, API_CONCURRENCY, async (agenda) => {
    try {
      let votes: AgendaVote[];
      try {
        votes = await client.getAgendaVoteList(agenda.agendaCode);
      } catch (error) {
        report.failed.push({ agendaCode: agenda.agendaCode, reason: errorText(error) });
        await prisma.parliamentAgenda.upsert({
          where: { agendaCode: agenda.agendaCode },
          create: { agendaCode: agenda.agendaCode, title: agenda.title },
          update: { title: agenda.title },
        });
        report.agendas++;
        return;
      }
      const saved = await saveAgenda(agenda, votes);
      report.agendas++;
      report.votes += votes.length;
      report.newVotes += saved.newVotes;
      if (saved.hasFinal) report.withFinalVote++;
    } catch (error) {
      report.failed.push({ agendaCode: agenda.agendaCode, reason: `DB: ${errorText(error)}` });
    } finally {
      done++;
      onProgress?.(done, agendas.length);
    }
  });
  return report;
}

// ───────────── Хуралдаан, гишүүд ─────────────

// from, to: "2024-01-01" хэлбэрийн огноо
export async function syncMeetings(from: string, to: string, client: ParliamentSource = parliament): Promise<number> {
  const meetings = await client.getMeetings(from, to);
  await eachLimit(meetings, DB_CONCURRENCY, async (m) => {
    const data = {
      title: m.title,
      description: m.description,
      startsAt: m.startsAt ? new Date(m.startsAt) : null,
      openedAt: m.openedAt ? new Date(m.openedAt) : null,
      endedAt: m.endedAt ? new Date(m.endedAt) : null,
    };
    await prisma.parliamentMeeting.upsert({ where: { id: m.id }, create: { id: m.id, ...data }, update: data });
  });
  return meetings.length;
}

// Энэ эрхээр API хоосон жагсаалт буцаадаг (0 мөр) — ирвэл хадгална
export async function syncMembers(client: ParliamentSource = parliament): Promise<number> {
  const members = await client.getMembers();
  for (const m of members) {
    // JSON.parse(JSON.stringify()) — API-ийн мөрийг Prisma-ийн Json төрөлд тааруулна
    const data = { name: m.name, email: m.email, data: JSON.parse(JSON.stringify(m.data)) };
    await prisma.parliamentMember.upsert({ where: { key: m.key }, create: { key: m.key, ...data }, update: data });
  }
  return members.length;
}

// ───────────── LawForum-ын бүх төсөл ─────────────

export type DraftSyncReport = { drafts: number; newDrafts: number; active: number };

function draftRow(p: ProjectListItem) {
  return {
    title: (p.title ?? "").replace(/\s+/g, " ").trim(),
    projectNumber: p.projectNumber,
    typeId: p.typeId,
    typeTitle: p.typeTitle,
    categoryId: p.categoryId,
    categoryTitle: p.categoryTitle,
    status: p.status,
    stage: p.stage,
    isActive: p.isActive,
    publishedAt: lawforumDate(p.publishedOnUtc),
  };
}

// ~1000 төсөл: шинийг нэг хүсэлтээр нэмж, өөрчлөгдсөнийг л шинэчилнэ. Гарчиггүй төслийг алгасна.
// /bills-ийн Project хүснэгтэд хүрэхгүй (тэрийг lib/lawforum-sync.ts хийдэг — зөвхөн идэвхтэй төсөл).
export async function syncLawDrafts(source: LawforumSource = lawforum): Promise<DraftSyncReport> {
  const projects = (await source.getAllProjects()).filter((p) => (p.title ?? "").trim());
  const saved = await prisma.lawDraft.findMany();
  const savedById = new Map(saved.map((row) => [row.id, row]));

  const fresh = projects.filter((p) => !savedById.has(p.id));
  if (fresh.length > 0) {
    await prisma.lawDraft.createMany({ data: fresh.map((p) => ({ id: p.id, ...draftRow(p) })), skipDuplicates: true });
  }
  const changed = projects.filter((p) => {
    const old = savedById.get(p.id);
    return old && !unchanged(old, draftRow(p));
  });
  await eachLimit(changed, DB_CONCURRENCY, async (p) => {
    await prisma.lawDraft.update({ where: { id: p.id }, data: draftRow(p) });
  });

  return { drafts: projects.length, newDrafts: fresh.length, active: projects.filter((p) => p.isActive).length };
}
