// lib/law/queries.ts
// DB-ээс уншиж, CLAUDE.md-ын хуваалцсан төрлүүдийн хэлбэрт оруулна (хуудас + API хоёулаа ашиглана).

import { prisma } from "@/lib/prisma";
import type {
  BillDetail,
  BillSummary,
  ClauseView,
  FilteredCommentView,
  GroupView,
  WordPart,
} from "@/lib/mock";
import { compareWords } from "./compare";

// ── 1. Нэг төслийн дэлгэрэнгүй (forStaff=false бол шүүгдсэн саналыг харуулахгүй) ──
export async function getBillDetail(id: string, forStaff: boolean): Promise<BillDetail | null> {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      clauses: {
        orderBy: { order: "asc" },
        include: {
          clusters: {
            orderBy: { createdAt: "asc" },
            include: { reply: true, _count: { select: { comments: true } } },
          },
          comments: {
            where: { filterStatus: { not: "RELEVANT" } },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
  if (!project) {
    return null;
  }

  const clauses: ClauseView[] = [];
  for (const clause of project.clauses) {
    // a. Бүлгүүд
    const groups: GroupView[] = [];
    for (const cluster of clause.clusters) {
      groups.push({
        id: cluster.id,
        title: cluster.label,
        summary: cluster.summary ?? "",
        commentCount: cluster._count.comments,
        replyDraft: cluster.reply?.aiDraft ?? null,
        replyText: cluster.reply?.finalText ?? null,
        reflection: cluster.reply?.reflection ?? "PENDING",
      });
    }

    // b. Шүүгдсэн саналууд (зөвхөн ажилтанд)
    const filtered: FilteredCommentView[] = [];
    if (forStaff) {
      for (const comment of clause.comments) {
        filtered.push({
          id: comment.id,
          text: comment.body,
          filterStatus: comment.filterStatus,
          filterReason: comment.filterReason ?? "",
        });
      }
    }

    // c. AI урсгалаар ороогүй хуучин заалт бол (seed гэх мэт) өөрчлөгдөөгүй гэж харуулна
    const oldText = clause.oldText ?? (clause.newText === null ? clause.originalText : null);
    const newText = clause.newText ?? (clause.oldText === null ? clause.originalText : null);
    let diff = clause.diff as WordPart[] | null;
    if (!diff) {
      diff = compareWords(oldText, newText);
    }

    clauses.push({
      id: clause.id,
      number: clause.number,
      oldText: oldText,
      newText: newText,
      changeType: clause.changeType,
      diff: diff,
      sourceQuote: clause.sourceQuote,
      what: clause.what,
      why: clause.why,
      who: clause.who,
      approved: clause.approved,
      applyError: clause.applyError,
      groups: groups,
      filtered: filtered,
    });
  }

  return {
    id: project.id,
    title: project.title,
    stage: project.billStage ?? "FIRST_READING",
    reasonText: project.reasonText,
    clauses: clauses,
  };
}

// ── 2. Ажилтны самбарт харагдах төслүүд (ажилтан өөрөө оруулсан) ──
export async function listBillSummaries(): Promise<BillSummary[]> {
  const projects = await prisma.project.findMany({
    where: { source: "UPLOAD" },
    orderBy: { createdAt: "desc" },
    include: {
      clauses: {
        include: {
          clusters: { include: { reply: true } },
          _count: { select: { comments: true } },
        },
      },
    },
  });

  const summaries: BillSummary[] = [];
  for (const project of projects) {
    let changedCount = 0;
    let unapprovedCount = 0;
    let commentCount = 0;
    let unansweredGroupCount = 0;
    for (const clause of project.clauses) {
      if (clause.changeType !== "UNCHANGED") changedCount++;
      if (clause.changeType !== "UNCHANGED" && !clause.approved) unapprovedCount++;
      commentCount += clause._count.comments;
      for (const cluster of clause.clusters) {
        if (!cluster.reply?.finalText) unansweredGroupCount++;
      }
    }
    const filteredCount = await prisma.comment.count({
      where: { clause: { projectId: project.id }, filterStatus: { not: "RELEVANT" } },
    });
    summaries.push({
      id: project.id,
      title: project.title,
      stage: project.billStage ?? "FIRST_READING",
      changedCount,
      unapprovedCount,
      commentCount,
      unansweredGroupCount,
      filteredCount,
    });
  }
  return summaries;
}

// ── 3. Иргэний өөрийн саналууд (бүлэг, хариу, тусгасан эсэх, заалтын өмнө/дараа) ──
export type MyCommentView = {
  id: string;
  text: string;
  createdAt: string;
  billId: string;
  billTitle: string;
  clauseNumber: string;
  oldText: string | null;
  newText: string | null;
  groupTitle: string | null;
  replyText: string | null;
  reflection: "PENDING" | "REFLECTED" | "NOT_REFLECTED";
};

export async function getMyComments(userId: string): Promise<MyCommentView[]> {
  const comments = await prisma.comment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      clause: { include: { project: { select: { id: true, title: true } } } },
      cluster: { include: { reply: true } },
    },
  });

  const result: MyCommentView[] = [];
  for (const comment of comments) {
    // Хариу зөвхөн ажилтан хадгалсны дараа (finalText) иргэнд харагдана
    const reply = comment.cluster?.reply ?? null;
    const replyText = reply?.finalText ?? null;
    result.push({
      id: comment.id,
      text: comment.body,
      createdAt: comment.createdAt.toISOString(),
      billId: comment.clause.project.id,
      billTitle: comment.clause.project.title,
      clauseNumber: comment.clause.number,
      oldText: comment.clause.oldText,
      newText: comment.clause.newText ?? comment.clause.originalText,
      groupTitle: comment.cluster?.label ?? null,
      replyText: replyText,
      reflection: replyText ? (reply?.reflection ?? "PENDING") : "PENDING",
    });
  }
  return result;
}
