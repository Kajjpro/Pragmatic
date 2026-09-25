// GET /api/bills/[id]/word → УИХ-ын гишүүдэд өгөх харьцуулсан хүснэгт (.doc)   (зөвхөн ажилтан)
// Word нь HTML хүснэгтийг шууд нээдэг тул нэмэлт сан хэрэггүй (lib/docx.ts-тэй ижил арга).
import { NextResponse } from "next/server";
import { requireStaff, handleError } from "@/lib/auth";
import { getBillDetail } from "@/lib/law/queries";
import type { WordPart } from "@/lib/mock";

export async function GET(_req: Request, ctx: RouteContext<"/api/bills/[id]/word">) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    const bill = await getBillDetail(id, true);
    if (!bill) {
      return NextResponse.json({ error: "Төсөл олдсонгүй" }, { status: 404 });
    }

    // 1. Өөрчлөгдсөн заалт бүрээр хүснэгтийн мөр бэлдэнэ
    let rows = "";
    for (const clause of bill.clauses) {
      if (clause.changeType === "UNCHANGED") {
        continue;
      }
      rows += `<tr>
        <td>${escapeHtml(clause.number)}</td>
        <td>${clause.oldText ? highlight(clause.diff, "old") : "<i>(шинээр нэмэгдсэн)</i>"}</td>
        <td>${clause.newText ? highlight(clause.diff, "new") : "<i>(хүчингүй болсон)</i>"}</td>
        <td>${escapeHtml(clause.sourceQuote ?? "")}</td>
      </tr>`;
    }

    // 2. Бүтэн баримт бичиг
    const html = `<html><head><meta charset="utf-8">
      <style>
        body { font-family: "Times New Roman"; font-size: 12pt; }
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #000; padding: 6px; vertical-align: top; }
        th { background: #e8ecf4; }
        .del { color: #b91c1c; text-decoration: line-through; }
        .add { color: #047857; font-weight: bold; text-decoration: underline; }
      </style></head><body>
      <h2 style="text-align:center">${escapeHtml(bill.title)}</h2>
      <p style="text-align:center">Харьцуулсан хүснэгт</p>
      <table>
        <tr><th>Заалт</th><th>Хүчин төгөлдөр хууль</th><th>Төсөл</th><th>Төслийн эх сурвалж</th></tr>
        ${rows}
      </table></body></html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "application/msword; charset=utf-8",
        "Content-Disposition": `attachment; filename="harits-${id}.doc"`,
      },
    });
  } catch (e) {
    return handleError(e);
  }
}

// Хуучин баганад хассан үгийг, шинэ баганад нэмсэн үгийг тодруулна
function highlight(parts: WordPart[], side: "old" | "new"): string {
  let html = "";
  for (const part of parts) {
    if (side === "old" && part.added) continue;
    if (side === "new" && part.removed) continue;
    const text = escapeHtml(part.value);
    if (part.removed) html += `<span class="del">${text}</span>`;
    else if (part.added) html += `<span class="add">${text}</span>`;
    else html += text;
  }
  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
