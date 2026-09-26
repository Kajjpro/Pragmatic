// УИХ-ын өгөгдөл ба санал хураалтын тоглоомын хэрэгсэл (ажилтны дэлгэцэнд товч байхгүй эсвэл сүлжээ муу үед):
//   npm run vote -- list                  бүх санал хураалт (тоглоом)
//   npm run vote -- sync                  ParliamentAPI + LawForum → DB (доорх бүх алхам), дахин ажиллуулж болно
//   npm run vote -- sync --from=2025-01-01 --to=2026-12-31    хуралдааны огноо (анхдагч: 2024-01-01 … 90 хоногийн дараа)
//   npm run vote -- reveal <agendaCode>   дүнг зарлаж, таамгийг оноожуулна
//
// sync-ийн алхмууд (нэг нь унавал бусад нь үргэлжилнэ):
//   1. ParliamentAPI хэлэлцэх асуудал + санал хураалт → ParliamentAgenda, ParliamentVote
//   2. ParliamentAPI хуралдаан → ParliamentMeeting
//   3. ParliamentAPI гишүүд → ParliamentMember
//   4. LawForum бүх төсөл → LawDraft
//   5. LawForum идэвхтэй төсөл → Project (/bills; lib/lawforum-sync.ts)
//   6. Тоглоомын санал хураалт → VoteEvent (lib/vote-events.ts)
import "dotenv/config";
import { ParliamentApiError } from "../lib/parliament";
import { revealVoteEvent } from "../lib/points";
import { prisma } from "../lib/prisma";
import { syncLawforumProjects } from "../lib/lawforum-sync";
import { syncAgendas, syncLawDrafts, syncMeetings, syncMembers } from "../lib/parliament-sync";
import { findRevealCounts, syncVoteEvents } from "../lib/vote-events";

const [command, ...rest] = process.argv.slice(2);
const flags = new Map(
  rest.filter((a) => a.startsWith("--")).map((a) => {
    const [key, value = ""] = a.slice(2).split("=");
    return [key, value] as const;
  }),
);
const agendaCode = rest.find((a) => !a.startsWith("--"));

async function list() {
  const events = await prisma.voteEvent.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      agendaCode: true, title: true, status: true, isReplay: true, hiddenSupport: true,
      actualSupport: true, actualOppose: true, _count: { select: { predictions: true } },
    },
  });
  console.table(
    events.map((e) => ({
      agendaCode: e.agendaCode,
      "Гарчиг": e.title.slice(0, 40),
      "Төлөв": e.status,
      "Replay": e.isReplay ? "тийм" : "үгүй",
      "Нууц тоо": e.hiddenSupport !== null ? "бий" : "алга",
      "Дүн": e.status === "REVEALED" ? `${e.actualSupport} / ${e.actualOppose}` : "-",
      "Таамаг": e._count.predictions,
    })),
  );
}

// ───────────── sync ─────────────

type Row = { "Алхам": string; "": string; "Хадгалсан": number | string; "Тэмдэглэл": string };

function day(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function errorText(e: unknown): string {
  if (e instanceof ParliamentApiError) return `${e.message} (сайт DB-ээс хэвийн ажиллана)`;
  return e instanceof Error ? e.message : String(e);
}

// Нэг алхмыг ажиллуулж, амжилттай эсэхийг хүснэгтэд нэмнэ
async function run(rows: Row[], name: string, work: () => Promise<{ saved: number | string; note: string }>) {
  const started = Date.now();
  process.stdout.write(`… ${name}\n`);
  try {
    const { saved, note } = await work();
    rows.push({ "Алхам": name, "": "✓", "Хадгалсан": saved, "Тэмдэглэл": `${note} (${Math.round((Date.now() - started) / 1000)} сек)` });
  } catch (e) {
    rows.push({ "Алхам": name, "": "✗", "Хадгалсан": "-", "Тэмдэглэл": errorText(e) });
  }
}

async function sync() {
  const from = flags.get("from") || "2024-01-01";
  const to = flags.get("to") || day(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
  const rows: Row[] = [];

  await run(rows, "1. Хэлэлцэх асуудал, санал хураалт", async () => {
    const r = await syncAgendas(undefined, (done, total) => {
      if (done % 50 === 0 || done === total) process.stdout.write(`   ${done}/${total}\n`);
    });
    const failed = r.failed.length ? `; ${r.failed.length} асуудлын санал хураалт татагдсангүй: ${r.failed.slice(0, 3).map((f) => `${f.agendaCode} (${f.reason})`).join(", ")}` : "";
    return {
      saved: `${r.agendas} асуудал, ${r.votes} санал хураалт`,
      note: `${r.newVotes} шинэ санал хураалт; ${r.withFinalVote} асуудлын эцсийн санал хураалт олдсон${failed}`,
    };
  });

  await run(rows, "2. Хуралдаан", async () => ({ saved: await syncMeetings(from, to), note: `${from} … ${to}` }));

  await run(rows, "3. Гишүүд", async () => {
    const saved = await syncMembers();
    return { saved, note: saved === 0 ? "API энэ эрхээр хоосон жагсаалт буцаадаг" : "" };
  });

  await run(rows, "4. LawForum бүх төсөл", async () => {
    const r = await syncLawDrafts();
    return { saved: r.drafts, note: `${r.newDrafts} шинэ, ${r.active} идэвхтэй` };
  });

  await run(rows, "5. LawForum идэвхтэй төсөл → /bills", async () => {
    const r = await syncLawforumProjects();
    return { saved: r.created + r.updated, note: `${r.active} идэвхтэй: ${r.created} шинэ, ${r.updated} шинэчилсэн` };
  });

  await run(rows, "6. Тоглоомын санал хураалт (VoteEvent)", async () => {
    const r = await syncVoteEvents();
    const skipped = r.skipped.length ? `; алгассан: ${r.skipped.map((s) => `${s.agendaCode} — ${s.reason}`).join("; ")}` : "";
    return { saved: r.created + r.updated, note: `${r.checked} шалгасан, ${r.created} шинэ, ${r.replays} replay${skipped}` };
  });

  console.log("\nParliamentAPI + LawForum → DB");
  console.table(rows);
  if (rows.some((r) => r[""] === "✗")) process.exitCode = 1;
}

// ───────────── reveal ─────────────

async function reveal(code: string) {
  const event = await prisma.voteEvent.findUnique({ where: { agendaCode: code }, select: { id: true } });
  if (!event) throw new Error(`${code} санал хураалт алга`);

  const found = await findRevealCounts(event.id);
  if (found.status === "ALREADY_REVEALED") throw new Error("Дүн аль хэдийн гарсан (npm run reset-demo-оор дахин нээнэ)");
  if (found.status !== "OK") throw new Error("Эцсийн хэлэлцүүлгийн санал хураалт хараахан болоогүй");

  const r = await revealVoteEvent(event.id, found.counts);
  if (!r) throw new Error("Дүн аль хэдийн гарсан");
  console.log(`✓ ${code}: дэмжсэн ${found.counts.support}, эсэргүүцсэн ${found.counts.oppose} → ${r.scored} таамаг, нийт +${r.pointsAwarded} оноо`);
}

async function main() {
  if (command === "list") return list();
  if (command === "sync") return sync();
  if (command === "reveal" && agendaCode) return reveal(agendaCode);
  console.log("Хэрэглээ: npm run vote -- list | sync [--from=YYYY-MM-DD --to=YYYY-MM-DD] | reveal <agendaCode>");
  process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error("✗", errorText(e));
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
