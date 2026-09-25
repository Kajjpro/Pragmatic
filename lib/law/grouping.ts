import { awardRelevantComment } from "@/lib/points";
import { prisma } from "@/lib/prisma";
import { ai as defaultAi, type AiApi } from "./ai";
import type { FilterStatus } from "./types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const aiDelay = () => Number(process.env.AI_CALL_DELAY_MS ?? 0) || 0;

const FILTER_STATUSES: FilterStatus[] = ["RELEVANT", "OFF_TOPIC", "ABUSIVE", "DUPLICATE"];

export async function groupBillComments(
  billId: string,
  ai: AiApi = defaultAi,
): Promise<{ clauses: number; groups: number; filtered: number }> {
  const clauses = await prisma.clause.findMany({
    where: { projectId: billId, comments: { some: {} } },
    orderBy: { order: "asc" },
    select: { id: true, number: true, oldText: true, newText: true },
  });

  let groupCount = 0;
  let clauseCount = 0;
  let filteredCount = 0;
  let firstCall = true;
  const pause = async () => {
    if (!firstCall && aiDelay()) await sleep(aiDelay());
    firstCall = false;
  };

  for (const clause of clauses) {
    const clauseText = clause.newText ?? clause.oldText ?? "";

    // Шинэ санал (шүүгдээгүй, эсвэл хамааралтай ч бүлэггүй) алга бол юу ч хийхгүй:
    // бэлэн (seed-ийн) бүлгүүд хэвээр үлдэж, AI дуудагдахгүй — демо дээр товч дарахад AI хүлээхгүй.
    const newComments = await prisma.comment.count({
      where: {
        clauseId: clause.id,
        clusterId: null,
        suspicious: false,
        OR: [{ filterStatus: null }, { filterStatus: "RELEVANT" }],
      },
    });
    if (newComments === 0) continue;

    await prisma.cluster.deleteMany({
      where: { clauseId: clause.id, reflection: "PENDING", replyText: null },
    });

    const unfiltered = await prisma.comment.findMany({
      where: { clauseId: clause.id, clusterId: null, suspicious: false, filterStatus: null },
      orderBy: { createdAt: "asc" },
      select: { id: true, body: true, userId: true },
    });
    if (unfiltered.length > 0) {
      await pause();
      const verdicts = await ai.filterComments(
        clauseText,
        unfiltered.map((c) => ({ id: c.id, text: c.body })),
      );
      const verdictById = new Map(verdicts.map((v) => [v.id, v]));

      for (const c of unfiltered) {
        const v = verdictById.get(c.id);
        const status = v && FILTER_STATUSES.includes(v.status) ? v.status : "RELEVANT";
        await prisma.comment.update({
          where: { id: c.id },
          data: { filterStatus: status, filterReason: v?.reason || null },
        });
        if (status !== "RELEVANT") filteredCount++;
        // Иргэний санал хамааралтай бол +2 оноо (нэг саналд нэг л удаа)
        else if (c.userId) await awardRelevantComment(c.userId, c.id);
      }
    }

    const relevant = await prisma.comment.findMany({
      where: { clauseId: clause.id, clusterId: null, suspicious: false, filterStatus: "RELEVANT" },
      orderBy: { createdAt: "asc" },
      select: { id: true, body: true },
    });
    if (relevant.length === 0) continue;
    clauseCount++;

    const bodyById = new Map(relevant.map((c) => [c.id, c.body]));

    await pause();
    const proposed = await ai.groupComments(
      clauseText,
      relevant.map((c) => ({ id: c.id, text: c.body })),
    );

    const used = new Set<string>();
    const groups = proposed
      .map((g) => ({
        title: g.title.trim() || "Санал",
        summary: g.summary,
        commentIds: g.commentIds.filter((id) => {
          if (!bodyById.has(id) || used.has(id)) return false;
          used.add(id);
          return true;
        }),
      }))
      .filter((g) => g.commentIds.length > 0);
    const leftover = relevant.filter((c) => !used.has(c.id)).map((c) => c.id);
    if (leftover.length > 0) {
      groups.push({ title: "Бусад санал", summary: `${leftover.length} санал`, commentIds: leftover });
    }

    for (const g of groups) {
      let replyDraft: string | null = null;
      try {
        await pause();
        replyDraft =
          (await ai.writeReply(clauseText, {
            title: g.title,
            summary: g.summary,
            comments: g.commentIds.map((id) => bodyById.get(id) as string),
          })) || null;
      } catch (err) {
        console.error(`writeReply failed for a group on clause ${clause.number}:`, err);
      }

      await prisma.cluster.create({
        data: {
          clauseId: clause.id,
          label: g.title,
          summary: g.summary,
          replyDraft,
          comments: { connect: g.commentIds.map((id) => ({ id })) },
        },
      });
      groupCount++;
    }
  }

  return { clauses: clauseCount, groups: groupCount, filtered: filteredCount };
}
