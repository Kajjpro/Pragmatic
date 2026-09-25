import { awardRelevantComment } from "@/lib/points";
import { prisma } from "@/lib/prisma";
import type { MyComment } from "@/lib/types";
import type { ChangeType, FilterStatus, Stage, WordPart } from "./types";

export const REFLECTIONS = ["PENDING", "REFLECTED", "NOT_REFLECTED"] as const;
export type ReflectionValue = (typeof REFLECTIONS)[number];

const FILTERED_OUT: FilterStatus[] = ["OFF_TOPIC", "ABUSIVE", "DUPLICATE"];

export type BillSummary = {
  id: string;
  title: string;
  stage: Stage;
  changedCount: number;
  unapprovedCount: number;
  commentCount: number;
  unansweredGroupCount: number;
  filteredCount: number;
};

export type GroupView = {
  id: string;
  title: string;
  summary: string;
  commentCount: number;
  replyDraft: string | null;
  replyText: string | null;
  reflection: ReflectionValue;
};

export type FilteredCommentView = {
  id: string;
  text: string;
  filterStatus: FilterStatus;
  filterReason: string;
};

export type ClauseView = {
  id: string;
  number: string;
  oldText: string | null;
  newText: string | null;
  changeType: ChangeType;
  diff: WordPart[];
  sourceQuote: string | null;
  what: string | null;
  why: string | null;
  who: string | null;
  approved: boolean;
  groups: GroupView[];
  filtered: FilteredCommentView[];
};

export type BillDetail = {
  id: string;
  title: string;
  stage: Stage;
  reasonText: string | null;
  clauses: ClauseView[];
};

export async function getBillList(staff: boolean): Promise<BillSummary[]> {
  const bills = await prisma.project.findMany({
    where: { amendmentText: { not: null } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      stage: true,
      clauses: {
        where: { changeType: { not: "UNCHANGED" } },
        select: {
          approved: true,
          comments: { select: { filterStatus: true } },
          clusters: { select: { repliedAt: true } },
        },
      },
    },
  });

  return bills
    .map((b): BillSummary => {
      const visible = staff ? b.clauses : b.clauses.filter((c) => c.approved);
      const comments = visible.flatMap((c) => c.comments);
      const isFiltered = (s: FilterStatus | null) => s !== null && FILTERED_OUT.includes(s);

      return {
        id: b.id,
        title: b.title,
        stage: b.stage,
        changedCount: visible.length,
        unapprovedCount: staff ? b.clauses.filter((c) => !c.approved).length : 0,
        commentCount: comments.filter((m) => !isFiltered(m.filterStatus)).length,
        unansweredGroupCount: staff
          ? visible.flatMap((c) => c.clusters).filter((g) => g.repliedAt === null).length
          : 0,
        filteredCount: staff ? comments.filter((m) => isFiltered(m.filterStatus)).length : 0,
      };
    })
    .filter((b) => staff || b.changedCount > 0);
}

export async function getBillView(id: string, staff: boolean): Promise<BillDetail | null> {
  const bill = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      stage: true,
      reasonText: true,
      clauses: {
        where: staff
          ? { changeType: { not: "UNCHANGED" } }
          : { changeType: { not: "UNCHANGED" }, approved: true },
        orderBy: { order: "asc" },
        select: {
          id: true,
          number: true,
          oldText: true,
          newText: true,
          changeType: true,
          diff: true,
          sourceQuote: true,
          what: true,
          why: true,
          who: true,
          approved: true,
          clusters: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              label: true,
              summary: true,
              replyDraft: true,
              replyText: true,
              reflection: true,
              repliedAt: true,
              _count: { select: { comments: true } },
            },
          },
          comments: {
            where: { filterStatus: { in: FILTERED_OUT }, restored: false },
            orderBy: { createdAt: "asc" },
            select: { id: true, body: true, filterStatus: true, filterReason: true },
          },
        },
      },
    },
  });
  if (!bill || (!staff && bill.clauses.length === 0)) return null;

  return {
    id: bill.id,
    title: bill.title,
    stage: bill.stage,
    reasonText: bill.reasonText,
    clauses: bill.clauses.map(
      (c): ClauseView => ({
        id: c.id,
        number: c.number,
        oldText: c.oldText,
        newText: c.newText,
        changeType: c.changeType,
        diff: c.diff as unknown as WordPart[],
        sourceQuote: staff ? c.sourceQuote : null,
        what: c.what,
        why: c.why,
        who: c.who,
        approved: c.approved,
        groups: c.clusters
          .filter((g) => staff || g.repliedAt !== null)
          .map(
            (g): GroupView => ({
              id: g.id,
              title: g.label,
              summary: g.summary ?? "",
              commentCount: g._count.comments,
              replyDraft: staff ? g.replyDraft : null,
              replyText: g.replyText,
              reflection: g.repliedAt ? g.reflection : "PENDING",
            }),
          ),
        filtered: staff
          ? c.comments.map((m) => ({
              id: m.id,
              text: m.body,
              filterStatus: m.filterStatus as FilterStatus,
              filterReason: m.filterReason ?? "",
            }))
          : [],
      }),
    ),
  };
}

export async function getMyComments(userId: string): Promise<MyComment[]> {
  const comments = await prisma.comment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      body: true,
      vote: true,
      filterStatus: true,
      createdAt: true,
      clause: {
        select: {
          id: true,
          number: true,
          changeType: true,
          oldText: true,
          newText: true,
          diff: true,
          project: { select: { id: true, title: true } },
        },
      },
      cluster: {
        select: {
          id: true,
          label: true,
          summary: true,
          replyText: true,
          reflection: true,
          repliedAt: true,
        },
      },
    },
  });

  return comments.map(({ body, cluster, clause, ...c }) => ({
    id: c.id,
    text: body,
    vote: c.vote,
    filterStatus: c.filterStatus,
    createdAt: c.createdAt.toISOString(),
    clause: {
      id: clause.id,
      number: clause.number,
      changeType: clause.changeType,
      oldText: clause.oldText,
      newText: clause.newText,
      diff: clause.diff as unknown as WordPart[],
      billId: clause.project.id,
      billTitle: clause.project.title,
    },
    group: cluster && {
      id: cluster.id,
      title: cluster.label,
      summary: cluster.summary,
      replyText: cluster.repliedAt ? cluster.replyText : null,
      reflection: cluster.repliedAt ? cluster.reflection : ("PENDING" as ReflectionValue),
      repliedAt: cluster.repliedAt ? cluster.repliedAt.toISOString() : null,
    },
  }));
}

export async function saveGroupReply(
  groupId: string,
  replyText: string,
  reflection: ReflectionValue,
) {
  return prisma.cluster
    .update({
      where: { id: groupId },
      data: { replyText, reflection, repliedAt: new Date(), status: "ANSWERED" },
      select: { id: true, replyText: true, reflection: true, repliedAt: true },
    })
    .catch(() => null);
}

export async function restoreComment(id: string) {
  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { filterStatus: true, restored: true, userId: true },
  });
  if (!comment) return null;

  const wasFiltered = comment.filterStatus !== null && FILTERED_OUT.includes(comment.filterStatus);
  if (!wasFiltered && !comment.restored) return { id, restored: false as const };

  if (wasFiltered) {
    await prisma.comment.update({ where: { id }, data: { filterStatus: "RELEVANT", restored: true } });
    // Ажилтан хамааралтай гэж сэргээсэн → иргэнд +2 (AI шүүлтэй адил, нэг л удаа)
    if (comment.userId) await awardRelevantComment(comment.userId, id);
  }
  return { id, restored: true as const };
}
