// Иргэн санал ирүүлж болох заалтууд: санал авч буй төслийн, ажлын алба баталсан, өөрчлөгдсөн заалт.
// POST /api/comments яг ийм заалтыг л хүлээн авна (app/api/comments/route.ts).
import { prisma } from "@/lib/prisma";
import type { CommentTarget } from "@/lib/types";

export async function getCommentTargets(): Promise<CommentTarget[]> {
  const projects = await prisma.project.findMany({
    where: {
      allowComments: true,
      clauses: { some: { approved: true, changeType: { not: "UNCHANGED" } } },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      clauses: {
        where: { approved: true, changeType: { not: "UNCHANGED" } },
        orderBy: { order: "asc" },
        select: { id: true, number: true, changeType: true, what: true },
      },
    },
  });
  return projects.map((p) => ({
    billId: p.id,
    billTitle: p.title,
    clauses: p.clauses,
  }));
}
