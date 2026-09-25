// Санал хураалтын тоглоомын нөөц хэрэгсэл (ажилтны дэлгэцэнд товч байхгүй эсвэл сүлжээ муу үед):
//   npm run vote -- list                  бүх санал хураалт
//   npm run vote -- sync                  ParliamentAPI → VoteEvent
//   npm run vote -- reveal <agendaCode>   дүнг зарлаж, таамгийг оноожуулна
import "dotenv/config";
import { ParliamentApiError } from "../lib/parliament";
import { revealVoteEvent } from "../lib/points";
import { prisma } from "../lib/prisma";
import { findRevealCounts, syncVoteEvents } from "../lib/vote-events";

const [command, agendaCode] = process.argv.slice(2);

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
  if (command === "sync") return console.log(await syncVoteEvents());
  if (command === "reveal" && agendaCode) return reveal(agendaCode);
  console.log("Хэрэглээ: npm run vote -- list | sync | reveal <agendaCode>");
  process.exitCode = 1;
}

main()
  .catch((e) => {
    const message = e instanceof ParliamentApiError ? `${e.message} (сайт DB-ээс хэвийн ажиллана)` : e instanceof Error ? e.message : e;
    console.error("✗", message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
