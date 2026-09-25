import { NextResponse } from "next/server";
import { handleError, HttpError, requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: RouteContext<"/api/bills/[id]/groups">) {
  try {
    await requireStaff();
    const { id } = await ctx.params;

    const clauses = await prisma.clause.findMany({
      where: { projectId: id, clusters: { some: {} } },
      orderBy: { order: "asc" },
      select: {
        id: true,
        number: true,
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
            comments: {
              orderBy: { createdAt: "asc" },
              select: { id: true, body: true, vote: true, createdAt: true },
            },
          },
        },
      },
    });
    if (clauses.length === 0) {
      const exists = await prisma.project.findUnique({ where: { id }, select: { id: true } });
      if (!exists) throw new HttpError(404, "Төсөл олдсонгүй");
    }

    return NextResponse.json(
      clauses.map((c) => ({
        clauseId: c.id,
        number: c.number,
        groups: c.clusters.map(({ label, comments, ...g }) => ({
          ...g,
          title: label,
          comments: comments.map(({ body, ...m }) => ({ ...m, text: body })),
        })),
      })),
    );
  } catch (e) {
    return handleError(e);
  }
}
