// Хоосон DB-г анх хуудас ачаалахад НЭГ удаа бөглөнө (/bills-ийн автомат sync-тэй адил санаа).
//   Карт, асуулт  ← data/precomputed.json (AI дуудахгүй, npm run seed-тэй адил)
//   Таамаг        ← ParliamentAgenda/ParliamentVote mirror-ийн эцсийн санал хураалт (npm run vote -- sync бөглөнө)
// DB огт хүрэхгүй бол lib/feed.ts нь data/ файлуудаас шууд уншина.
import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { listAgendas } from "@/lib/parliament-data";
import { prisma } from "@/lib/prisma";
import { parseSeedData, seedDatabase, type SeedData } from "@/lib/seed";

export const DATA_DIR = join(process.cwd(), "data");

export function readPrecomputed(): SeedData {
  return parseSeedData(readFileSync(join(DATA_DIR, "precomputed.json"), "utf8"));
}

// Нэг процесст нэг л удаа ажиллана; алдаа гарвал дараагийн хүсэлт дахин оролдоно
function once(run: () => Promise<void>) {
  let running: Promise<void> | null = null;
  return () => {
    running ??= run().catch((error) => {
      running = null;
      throw error;
    });
    return running;
  };
}

export const ensureCards = once(async () => {
  if ((await prisma.card.count()) > 0) return;
  const r = await seedDatabase(readPrecomputed(), {
    dataDir: DATA_DIR,
    staffEmails: (process.env.STAFF_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean),
  });
  console.log(`Карт хоосон байсан → precomputed.json-оос ${r.cards} карт, ${r.questions} асуулт оруулав`);
});

// Питчид шалгасан асуудлууд (scripts/seed-replays.sql-тэй ижил) — ойлгомжтой гарчиг, төвийг сахисан асуулт
const PICKS: Record<string, { title: string; hook: string }> = {
  "20250200015": { title: "Хянан шалгах түр хороо байгуулах тухай", hook: "УИХ хянан шалгах түр хороо байгуулахыг дэмжих үү?" },
  "20250200030": { title: "2026 оны төсөвтэй холбогдуулан авах арга хэмжээ", hook: "Төсөвтэй холбоотой энэ тогтоолыг УИХ батлах уу?" },
  "20260100004": { title: "Гэр бүлийн тухай хууль (шинэчилсэн найруулга)", hook: "Гэр бүлийн тухай шинэ хуулийг УИХ батлах уу?" },
  "20260100083": { title: "Замын хөдөлгөөний аюулгүй байдлын хуулийн өөрчлөлт", hook: "Замын хөдөлгөөний дүрмийн хуулийн өөрчлөлтийг УИХ дэмжих үү?" },
  "20260100123": { title: "Олон хүүхэдтэй эхийг урамшуулах хуулийн өөрчлөлт", hook: "Олон хүүхэдтэй ээжүүдийн урамшууллын өөрчлөлтийг УИХ батлах уу?" },
  "20250200026": { title: "НӨАТ-ын хуулийн нэмэлт, өөрчлөлт", hook: "НӨАТ-ын хуулийн өөрчлөлтийг УИХ батлах уу?" },
  "20250100097": { title: "Зээлийн хүүг бууруулах арга хэмжээ", hook: "Зээлийн хүүг бууруулах тогтоолыг УИХ дэмжих үү?" },
  "20260100179": { title: "Эрүүл мэндийн тухай хуулийн нэмэлт, өөрчлөлт", hook: "Эрүүл мэндийн хуулийн өөрчлөлтийг УИХ батлах уу?" },
};

export const ensureVoteEvents = once(async () => {
  if ((await prisma.voteEvent.count()) > 0) return;

  // Эцсийн санал хураалт нь олдсон асуудлууд (тоо нь бодит, reveal хүртэл hidden* талбарт нууц)
  const agendas = await listAgendas({ q: "", limit: 500, offset: 0 });
  if (agendas.source !== "db") return; // mirror хоосон — тоо зохиохгүй
  const withFinal = agendas.items.filter((a) => a.finalVote);
  const picked = [
    ...withFinal.filter((a) => PICKS[a.agendaCode]),
    ...withFinal.filter((a) => !PICKS[a.agendaCode]),
  ].slice(0, 8);

  for (const a of picked) {
    const v = a.finalVote!;
    const pick = PICKS[a.agendaCode];
    await prisma.voteEvent.upsert({
      where: { agendaCode: a.agendaCode },
      update: {},
      create: {
        id: `replay-${a.agendaCode}`,
        agendaCode: a.agendaCode,
        title: pick?.title ?? a.title,
        hook: pick?.hook ?? "Энэ асуудлыг УИХ батлах уу?",
        status: "OPEN",
        isReplay: true,
        hiddenSupport: v.support,
        hiddenOppose: v.oppose,
        hiddenTotal: v.total,
      },
    });
  }
  console.log(`Таамаг хоосон байсан → ${picked.length} өмнөх санал хураалтыг дахин тоглохоор нэмэв`);
});
