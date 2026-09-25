import { handleError, HttpError, requireStaff } from "@/lib/auth";
import type { WordPart } from "@/lib/law/types";
import { prisma } from "@/lib/prisma";
import { makeWordFile } from "@/lib/word";

export async function GET(_req: Request, ctx: RouteContext<"/api/bills/[id]/word">) {
  try {
    await requireStaff();
    const { id } = await ctx.params;

    const bill = await prisma.project.findUnique({
      where: { id },
      select: {
        title: true,
        clauses: {
          where: { changeType: { not: "UNCHANGED" } },
          orderBy: { order: "asc" },
          select: { number: true, oldText: true, newText: true, changeType: true, diff: true },
        },
      },
    });
    if (!bill) throw new HttpError(404, "Төсөл олдсонгүй");

    const buf = await makeWordFile({
      title: bill.title,
      clauses: bill.clauses.map((c) => ({ ...c, diff: c.diff as unknown as WordPart[] })),
    });

    const name = encodeURIComponent(`${bill.title} - Харьцуулсан хүснэгт.docx`);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="comparison.docx"; filename*=UTF-8''${name}`,
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
