// Бодит API-уудыг дарааллаар нь дуудаж, хариу бүрийг data/snapshots/<функц>.json-д хадгалж,
// талбарууд ба эхний мөрийг хэвлэнэ. DB, AI хэрэглэхгүй. Дахин ажиллуулахад snapshot-ууд шинэчлэгдэнэ.
//
//   npm run discover
//   npm run discover -- --from=2025-01-01 --to=2026-09-30     getMeetings-ийн огноо (анхдагч: сүүлийн 1 жил)
//
// Дараалал — өмнөх хариунаас ID авч дараагийнхад дамжуулна:
//   login → getAgendaList → getAgendaVoteList(agendaCode) → getMeetings(d1, d2) → getVotingList(meetingId)
//   → getVotingResult(meetingId, voteid) → getMembers → getAttendsum (гишүүнд имэйл байвал л) → getBH
//   → LawForum: project-types → project-categories → projects (бүх хуудас) → projects/{id}
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  callRaw,
  checkLogin,
  finalReadingVote,
  parseAgendaList,
  parseAgendaVoteList,
  parseMeetings,
  parseMembers,
  parseVotingList,
  parseVotingResult,
  type Agenda,
  type Meeting,
  type Member,
  type MeetingVote,
} from "../lib/parliament";
import { getCategories, getProject, getProjects, getTypes, MAX_PAGE_SIZE, type ProjectListItem } from "../lib/lawforum";
import { SNAPSHOT_DIR, snapshotPath } from "../lib/snapshots";

type Row = Record<string, unknown>;
type Step = { func: string; status: "ok" | "fail" | "skip"; rows: number | null; ms: number; note: string };

const steps: Step[] = [];
const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value = ""] = arg.replace(/^--/, "").split("=");
    return [key, value] as const;
  }),
);
const day = (d: Date) => d.toISOString().slice(0, 10);
const d2 = args.get("to") || day(new Date());
const d1 = args.get("from") || day(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000));

// ───────────── Туслах ─────────────

function save(name: string, func: string, params: Row, response: unknown) {
  writeFileSync(snapshotPath(name), JSON.stringify({ func, params, fetchedAt: new Date().toISOString(), response }, null, 2) + "\n");
}

function typeOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

// Хариуны дээд түвшний түлхүүрүүд, мөрийн талбарууд, эхний мөр
function print(func: string, name: string, response: unknown, rows: unknown[], parsed: number) {
  const top = response && typeof response === "object" && !Array.isArray(response) ? Object.keys(response).join(", ") : typeOf(response);
  console.log(`✓ ${func} — ${rows.length} мөр, манай parser ${parsed}-г таньсан → data/snapshots/${name}.json`);
  console.log(`    хариу: { ${top} }`);
  const first = rows[0];
  if (!first || typeof first !== "object") {
    console.log("    мөр алга");
    return;
  }
  console.log(`    талбарууд: ${Object.entries(first).map(([k, v]) => `${k}: ${typeOf(v)}`).join(", ")}`);
  const text = JSON.stringify(first);
  console.log(`    эхний мөр: ${text.length > 600 ? `${text.slice(0, 600)}…` : text}`);
}

async function step<T>(func: string, work: () => Promise<{ value: T; rows: number; note?: string }>): Promise<T | null> {
  const started = Date.now();
  try {
    const { value, rows, note = "" } = await work();
    steps.push({ func, status: "ok", rows, ms: Date.now() - started, note });
    return value;
  } catch (error) {
    const note = error instanceof Error ? error.message : String(error);
    steps.push({ func, status: "fail", rows: null, ms: Date.now() - started, note });
    console.log(`✗ ${func}: ${note}`);
    return null;
  }
}

function skip(func: string, note: string) {
  steps.push({ func, status: "skip", rows: null, ms: 0, note });
  console.log(`– ${func}: ${note}`);
}

// ───────────── ParliamentAPI ─────────────

async function discoverParliament() {
  console.log(`\n══ ParliamentAPI (${process.env.PARLIAMENT_API_URL ?? "PARLIAMENT_API_URL алга"})\n`);

  const login = await step("login", async () => {
    const s = await checkLogin();
    console.log(`✓ login — token ${s.expiresAt.toISOString()} хүртэл хүчинтэй, JSESSIONID cookie ${s.hasSessionCookie ? "авсан" : "ИРСЭНГҮЙ"}`);
    return { value: s, rows: 0, note: s.hasSessionCookie ? "Bearer token + JSESSIONID cookie" : "JSESSIONID cookie ирсэнгүй" };
  });
  if (!login) return;

  // 1. Хэлэлцэх асуудлууд
  const agendas = await step<Agenda[]>("getAgendaList", async () => {
    const body = await callRaw("ParliamentService", "getAgendaList");
    save("getAgendaList", "getAgendaList", {}, body);
    const items = parseAgendaList(body);
    print("getAgendaList", "getAgendaList", body, body.data as unknown[], items.length);
    return { value: items, rows: items.length };
  });

  // 2. Эхний асуудлуудаас санал хураалттай эхнийх нь
  if (agendas?.length) {
    await step("getAgendaVoteList", async () => {
      let empty = 0;
      for (const agenda of agendas.slice(0, 20)) {
        const body = await callRaw("ParliamentService", "getAgendaVoteList", { agendaCode: agenda.agendaCode });
        const items = parseAgendaVoteList(body);
        if (items.length === 0) {
          empty++;
          continue;
        }
        save("getAgendaVoteList", "getAgendaVoteList", { agendaCode: agenda.agendaCode }, body);
        print("getAgendaVoteList", "getAgendaVoteList", body, body.data as unknown[], items.length);
        const final = finalReadingVote(items);
        const finalNote = final ? `эцсийн санал хураалт ${final.support}/${final.oppose}/${final.total}` : "эцсийн санал хураалт алга";
        return { value: items, rows: items.length, note: `agendaCode ${agenda.agendaCode}; ${finalNote}; ${empty} хоосныг алгассан` };
      }
      throw new Error("эхний 20 асуудлын алинд нь ч санал хураалт алга");
    });
  } else {
    skip("getAgendaVoteList", "agendaCode алга (getAgendaList амжилтгүй)");
  }

  // 3. Хуралдаанууд
  const meetings = await step<Meeting[]>("getMeetings", async () => {
    const body = await callRaw("ParliamentService", "getMeetings", { d1, d2 });
    save("getMeetings", "getMeetings", { d1, d2 }, body);
    const items = parseMeetings(body);
    print("getMeetings", "getMeetings", body, body.data as unknown[], items.length);
    return { value: items, rows: items.length, note: `${d1} … ${d2}` };
  });

  // 4. Хамгийн сүүлийн, санал хураалттай хуралдаан
  let meetingVotes: { meetingId: number; votes: MeetingVote[] } | null = null;
  if (meetings?.length) {
    meetingVotes = await step("getVotingList", async () => {
      const newest = [...meetings].sort((a, b) => (b.startsAt ?? "").localeCompare(a.startsAt ?? "")).slice(0, 15);
      let empty = 0;
      for (const meeting of newest) {
        const body = await callRaw("ParliamentService", "getVotingList", { meetingId: meeting.id });
        const items = parseVotingList(body);
        if (items.length === 0) {
          empty++;
          continue;
        }
        save("getVotingList", "getVotingList", { meetingId: meeting.id }, body);
        print("getVotingList", "getVotingList", body, body.data as unknown[], items.length);
        return { value: { meetingId: meeting.id, votes: items }, rows: items.length, note: `meetingId ${meeting.id}; ${empty} хоосон хуралдааныг алгассан` };
      }
      throw new Error("сүүлийн 15 хуралдааны алинд нь ч санал хураалт алга");
    });
  } else {
    skip("getVotingList", "meetingId алга (getMeetings хоосон эсвэл амжилтгүй)");
  }

  // 5. Нэг санал хураалтын гишүүн бүрийн санал — зөвхөн шалгалтад, нийтэд гаргахгүй
  if (meetingVotes) {
    const { meetingId, votes } = meetingVotes;
    await step("getVotingResult", async () => {
      const vote = votes[0];
      const body = await callRaw("ParliamentService", "getVotingResult", { meetingId, voteid: vote.customId });
      save("getVotingResult", "getVotingResult", { meetingId, voteid: vote.customId }, body);
      const ballots = parseVotingResult(body);
      print("getVotingResult", "getVotingResult", body, body.data as unknown[], ballots.length);
      const yes = ballots.filter((b) => b.result === "Зөвшөөрсөн").length;
      const match = yes === vote.support && ballots.length === vote.total ? "тоо getVotingList-тэй таарч байна" : `⚠ тоо зөрж байна (${yes}/${ballots.length} ба ${vote.support}/${vote.total})`;
      return { value: ballots, rows: ballots.length, note: `voteid ${vote.customId}; ${match}` };
    });
  } else {
    skip("getVotingResult", "voteid алга (getVotingList хоосон эсвэл амжилтгүй)");
  }

  // 6. /Service — гишүүд. Имэйл өгвөл л ирц, микрофоны тайланг шалгана.
  const members = await step<Member[]>("getMembers", async () => {
    const body = await callRaw("Service", "getMembers");
    save("getMembers", "getMembers", {}, body);
    const items = parseMembers(body);
    print("getMembers", "getMembers", body, ((body.res as Row | undefined)?.members as unknown[]) ?? [], items.length);
    const withEmail = items.filter((m) => m.email).length;
    return { value: items, rows: items.length, note: withEmail ? `${withEmail} гишүүнд имэйл бий` : "имэйл алга" };
  });

  const email = members?.find((m) => m.email)?.email;
  if (email) {
    await step("getAttendsum", async () => {
      const body = await callRaw("Service", "getAttendsum", { email, d1, d2 });
      save("getAttendsum", "getAttendsum", { email, d1, d2 }, body);
      const res = body.res;
      const rows = Array.isArray(res) ? res : res && typeof res === "object" ? [res] : [];
      print("getAttendsum", "getAttendsum", body, rows, rows.length);
      return { value: body, rows: rows.length };
    });
  } else {
    skip("getAttendsum, getAttends, getMicUsageSum, getvotesummary, profile, bh", "getMembers имэйл өгөөгүй тул алгасав");
  }

  await step("getBH", async () => {
    const body = await callRaw("Service", "getBH");
    save("getBH", "getBH", {}, body);
    const rows = ((body.res as Row | undefined)?.bhs as unknown[]) ?? [];
    print("getBH", "getBH", body, rows, rows.length);
    return { value: rows, rows: rows.length };
  });
}

// ───────────── LawForum ─────────────

async function discoverLawforum() {
  console.log(`\n══ LawForumAPI (${process.env.LAWFORUM_API_URL ?? "анхдагч хаяг"}) — нэвтрэлт шаардахгүй\n`);

  await step("lawforum project-types", async () => {
    const types = await getTypes();
    save("lawforum-project-types", "GET /api/v1/project-types", {}, types);
    print("lawforum project-types", "lawforum-project-types", types, types, types.length);
    return { value: types, rows: types.length };
  });

  await step("lawforum project-categories", async () => {
    const categories = await getCategories();
    save("lawforum-project-categories", "GET /api/v1/project-categories", {}, categories);
    print("lawforum project-categories", "lawforum-project-categories", categories, categories, categories.length);
    return { value: categories, rows: categories.length };
  });

  // Хуудсуудыг нэгтгэж нэг snapshot болгоно — /api/drafts-ийн нөөцөд бүх төсөл хэрэгтэй
  const projects = await step<ProjectListItem[]>("lawforum projects", async () => {
    const first = await getProjects(1, MAX_PAGE_SIZE);
    const items = [...first.items];
    for (let page = 2; page <= first.totalPages; page++) items.push(...(await getProjects(page, MAX_PAGE_SIZE)).items);
    const merged = { ...first, items };
    save("lawforum-projects", "GET /api/v1/projects", { pageSize: MAX_PAGE_SIZE, pages: first.totalPages }, merged);
    print("lawforum projects", "lawforum-projects", merged, items, items.length);
    const active = items.filter((p) => p.isActive).length;
    return { value: items, rows: items.length, note: `нийт ${first.totalCount}, идэвхтэй ${active}; ${first.totalPages} хуудсыг нэгтгэсэн` };
  });

  if (projects?.length) {
    await step("lawforum projects/{id}", async () => {
      const pick = projects.find((p) => p.isActive) ?? projects[0];
      const detail = await getProject(pick.id);
      save("lawforum-project", `GET /api/v1/projects/${pick.id}`, { id: pick.id }, detail);
      print("lawforum projects/{id}", "lawforum-project", detail, [detail], 1);
      return { value: detail, rows: 1, note: `id ${pick.id}${pick.isActive ? " (идэвхтэй)" : ""}` };
    });
  } else {
    skip("lawforum projects/{id}", "төслийн id алга");
  }
}

async function main() {
  mkdirSync(SNAPSHOT_DIR, { recursive: true });
  await discoverParliament();
  await discoverLawforum();

  console.log("\n══ Дүн\n");
  console.table(
    steps.map((s) => ({
      "функц": s.func,
      "": s.status === "ok" ? "✓" : s.status === "skip" ? "–" : "✗",
      "мөр": s.rows ?? "",
      "мс": s.ms,
      "тэмдэглэл": s.note.length > 90 ? `${s.note.slice(0, 90)}…` : s.note,
    })),
  );
  if (steps.some((s) => s.status === "fail")) process.exitCode = 1;
}

main().catch((error) => {
  console.error("✗", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
