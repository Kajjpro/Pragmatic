// lib/law/pipeline.ts
// AI функцуудыг DB-тэй холбосон 2 урсгал. Ажилтан товч дарахад л ажиллана (хуудас ачааллахад биш).
//   createBill        — хууль + төсөл + үндэслэл → харьцуулалт + иргэнд тайлбар → DB
//   groupBillComments — шинэ саналуудыг шүүх → бүлэглэх → хариуны ноорог → DB

import { prisma } from "@/lib/prisma";
import type { Stage } from "@/lib/mock";
import { readAmendment } from "@/lib/ai/amendment";
import { explainChange } from "@/lib/ai/explain";
import { filterComments, groupComments, CommentInput } from "@/lib/ai/comments";
import { writeReply } from "@/lib/ai/reply";
import { splitIntoClauses } from "./clauses";
import { applyChanges } from "./apply";
import { compareWords } from "./compare";

export type NewBillInput = {
  title: string;
  stage: Stage;
  currentLawText: string;
  amendmentText: string;
  reasonText: string;
};

// ════════════════════════════════════════════════
// 1. Шинэ төсөл оруулах
// ════════════════════════════════════════════════
export async function createBill(input: NewBillInput): Promise<string> {
  // 1. Одоогийн хуулийг заалт бүрээр хуваана
  const oldClauses = splitIntoClauses(input.currentLawText);

  // 2. AI: төслийн өөрчлөлтүүдийг уншина
  const changes = await readAmendment(input.amendmentText);

  // 3. Өөрчлөлтүүдийг хуучин заалтуудад хэрэгжүүлнэ
  const applied = applyChanges(oldClauses, changes);

  // 4. Төслийг DB-д хадгална
  const project = await prisma.project.create({
    data: {
      title: input.title,
      source: "UPLOAD",
      billStage: input.stage,
      currentLawText: input.currentLawText,
      amendmentText: input.amendmentText,
      reasonText: input.reasonText,
      allowComments: true,
      publishedAt: new Date(),
    },
  });

  // 5. Өөрчлөгдсөн заалт бүрийг тайлбартай нь хадгална
  let order = 0;
  for (const clause of applied) {
    const changeType = getChangeType(clause.oldText, clause.newText, clause.applyError);
    if (changeType === "UNCHANGED") {
      continue; // өөрчлөгдөөгүй заалтыг хадгалахгүй
    }

    // a. AI: иргэнд зориулсан тайлбар (хэрэгжүүлж чадаагүй заалтад тайлбар хийхгүй)
    let what: string | null = null;
    let why: string | null = null;
    let who: string | null = null;
    if (clause.applyError === null) {
      const explanation = await explainChange(clause.oldText, clause.newText, input.reasonText);
      what = explanation.what || null;
      why = explanation.why || null;
      who = explanation.who || null;
    }

    // b. Хадгална
    order = order + 1;
    await prisma.clause.create({
      data: {
        projectId: project.id,
        number: clause.number,
        originalText: clause.newText ?? clause.oldText ?? "",
        order: order,
        oldText: clause.oldText,
        newText: clause.newText,
        changeType: changeType,
        diff: compareWords(clause.oldText, clause.newText),
        sourceQuote: clause.sourceQuote,
        applyError: clause.applyError,
        what: what,
        why: why,
        who: who,
      },
    });
  }

  return project.id;
}

// Хуучин ба шинэ текстээс өөрчлөлтийн төрлийг тодорхойлно
function getChangeType(
  oldText: string | null,
  newText: string | null,
  applyError: string | null
): "ADDED" | "REMOVED" | "CHANGED" | "UNCHANGED" {
  if (applyError !== null) return "CHANGED"; // алдаатайг ажилтанд заавал харуулна
  if (oldText === null && newText !== null) return "ADDED";
  if (oldText !== null && newText === null) return "REMOVED";
  if (oldText === newText) return "UNCHANGED";
  return "CHANGED";
}

// ════════════════════════════════════════════════
// 2. Иргэдийн саналыг шүүх → бүлэглэх → хариуны ноорог
// ════════════════════════════════════════════════
export type GroupResult = {
  newComments: number; // энэ удаа шүүсэн шинэ санал
  filtered: number; // үүнээс шүүгдсэн (RELEVANT биш)
  groups: number; // шинээр үүссэн бүлэг
};

export async function groupBillComments(projectId: string): Promise<GroupResult> {
  const result: GroupResult = { newComments: 0, filtered: 0, groups: 0 };

  const clauses = await prisma.clause.findMany({
    where: { projectId: projectId },
    orderBy: { order: "asc" },
  });

  for (const clause of clauses) {
    const clauseText = clause.newText ?? clause.oldText ?? clause.originalText;

    // ── 1. ШҮҮХ: хараахан шүүгээгүй шинэ саналууд ──
    const newComments = await prisma.comment.findMany({
      where: { clauseId: clause.id, filteredAt: null },
      orderBy: { createdAt: "asc" },
    });
    if (newComments.length > 0) {
      const labels = await filterComments(clauseText, toCommentInputs(newComments));
      for (const label of labels) {
        await prisma.comment.update({
          where: { id: label.id },
          data: {
            filterStatus: label.status,
            filterReason: label.reason || null,
            filteredAt: new Date(),
          },
        });
        result.newComments = result.newComments + 1;
        if (label.status !== "RELEVANT") {
          result.filtered = result.filtered + 1;
        }
      }
    }

    // ── 2. БҮЛЭГЛЭХ: бүлэгт ороогүй хамааралтай саналууд (сэргээсэн саналууд ч энд орно) ──
    const toGroup = await prisma.comment.findMany({
      where: { clauseId: clause.id, filterStatus: "RELEVANT", clusterId: null },
      orderBy: { createdAt: "asc" },
    });
    if (toGroup.length === 0) {
      continue;
    }
    const groups = await groupComments(clauseText, toCommentInputs(toGroup));

    // ── 3. Бүлэг бүрийг хадгалж, хариуны ноорог бичүүлнэ ──
    for (const group of groups) {
      const cluster = await prisma.cluster.create({
        data: { clauseId: clause.id, label: group.title, summary: group.summary },
      });
      await prisma.comment.updateMany({
        where: { id: { in: group.commentIds } },
        data: { clusterId: cluster.id },
      });

      // Эхний 3 саналыг жишээ болгоно
      const examples: string[] = [];
      for (const comment of toGroup) {
        if (group.commentIds.includes(comment.id) && examples.length < 3) {
          examples.push(comment.body);
        }
      }
      const draft = await writeReply(clauseText, {
        title: group.title,
        summary: group.summary,
        examples: examples,
      });
      await prisma.reply.create({
        data: { clusterId: cluster.id, aiDraft: draft || null },
      });
      result.groups = result.groups + 1;
    }
  }

  return result;
}

// DB-ийн саналыг AI функцийн оролтын хэлбэрт оруулна
function toCommentInputs(comments: { id: string; body: string }[]): CommentInput[] {
  const inputs: CommentInput[] = [];
  for (const comment of comments) {
    inputs.push({ id: comment.id, text: comment.body });
  }
  return inputs;
}
