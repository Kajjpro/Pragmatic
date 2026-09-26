// Нүүр хуудасны "бодит тоо". Зөвхөн бодит эх сурвалжаас; авч чадахгүй бол null (хуудсан дээр нуугдана).
// УИХ-ын өгөгдлийг манай sync-ийн хүснэгтээс (хоосон бол data/snapshots/) уншина — гадны API-г шууд дуудахгүй.
import { unstable_cache } from "next/cache";
import { listAgendas, listDrafts, type AgendaItem, type DraftItem } from "@/lib/parliament-data";
import { prisma } from "@/lib/prisma";

export type LiveStats = {
  agendaCount: number | null; // УИХ-ын хэлэлцэх асуудлын тоо (ParliamentAPI)
  draftCount: number | null; // LawForum-д нийтлэгдсэн хуулийн төслийн тоо
  lastVoteDate: string | null; // Хамгийн сүүлийн санал хураалтын огноо
  citizenComments: number | null; // Хариу-д иргэдийн өгсөн санал (0 бол null)
  recentVotes: AgendaItem[]; // Сүүлд эцэслэн санал хураасан асуудлууд (зөвхөн тоо)
  recentDrafts: DraftItem[]; // LawForum-д сүүлд нийтлэгдсэн төслүүд
  updatedAt: string;
};

// Алдаа гарвал хуудсыг унагахгүй — тэр хэсэг л нуугдана
async function safe<T>(load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load();
  } catch (error) {
    console.error("Нүүр хуудасны статистик:", error instanceof Error ? error.message : error);
    return fallback;
  }
}

async function loadStats(): Promise<LiveStats> {
  const [agendas, drafts, comments] = await Promise.all([
    safe(() => listAgendas({ q: "", limit: 30, offset: 0 }), null),
    safe(() => listDrafts({ q: "", limit: 3, offset: 0, active: false }), null),
    safe(() => prisma.comment.count(), 0),
  ]);

  const items = agendas?.items ?? [];
  const lastVoteDate = items.reduce<string | null>(
    (last, a) => (a.lastVotedAt && (!last || a.lastVotedAt > last) ? a.lastVotedAt : last),
    null,
  );

  return {
    agendaCount: agendas && agendas.total > 0 ? agendas.total : null,
    draftCount: drafts && drafts.total > 0 ? drafts.total : null,
    lastVoteDate,
    citizenComments: comments > 0 ? comments : null,
    recentVotes: items.filter((a) => a.finalVote).slice(0, 3),
    recentDrafts: drafts?.items ?? [],
    updatedAt: new Date().toISOString(),
  };
}

// 10 минут тутам шинэчилнэ
export const getLiveStats = unstable_cache(loadStats, ["home-live-stats-v2"], { revalidate: 600 });
