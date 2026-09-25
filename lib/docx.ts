import type { Directive, Report } from "./stub/types";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function decisionLabel(d: Directive["decision"]) {
  if (d === "correct") return "Зөв";
  if (d === "wrong") return "Буруу";
  return "Хүлээгдэж буй";
}

function flagLabel(f: Directive["flag"]) {
  return { HIGH: "Өндөр", MEDIUM: "Дунд", LOW: "Бага", OK: "Зөв" }[f];
}

export function downloadReportDocx(
  report: Report,
  decisions: Record<string, Directive["decision"]>,
  notes: Record<string, string>,
) {
  const decided = report.directives.filter(
    (d) => decisions[d.id] !== "pending",
  ).length;

  const rows = report.directives
    .map((d) => {
      const dec = decisions[d.id] ?? "pending";
      const note = notes[d.id] ?? "";
      return `
        <tr>
          <td style="border:1px solid #d0d7e2;padding:6px;font-family:Consolas,monospace;">${escapeHtml(d.code)}</td>
          <td style="border:1px solid #d0d7e2;padding:6px;">${escapeHtml(d.goal)}</td>
          <td style="border:1px solid #d0d7e2;padding:6px;text-align:center;">${escapeHtml(flagLabel(d.flag))}</td>
          <td style="border:1px solid #d0d7e2;padding:6px;text-align:center;">${d.ownerScore} / ${d.auditorScore}</td>
          <td style="border:1px solid #d0d7e2;padding:6px;text-align:center;"><b>${escapeHtml(decisionLabel(dec))}</b></td>
          <td style="border:1px solid #d0d7e2;padding:6px;">${escapeHtml(note) || "&nbsp;"}</td>
        </tr>`;
    })
    .join("");

  const today = new Date().toISOString().slice(0, 10);

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(report.agency)} — ${escapeHtml(report.period)}</title>
  <style>
    body { font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; color:#0b1220; }
    h1 { color:#0f2a63; font-size:22px; margin:0 0 4px; }
    h2 { color:#123278; font-size:14px; margin-top:24px; }
    .meta { color:#6b7692; font-size:12px; }
    .metrics { margin-top:16px; }
    .metrics td { padding:6px 12px; border:1px solid #d0d7e2; background:#f2f5fc; font-size:12px; }
    table { width:100%; border-collapse:collapse; margin-top:10px; font-size:12px; }
    th { background:#0f2a63; color:#fff; padding:6px; text-align:left; }
  </style>
</head>
<body>
  <h1>${escapeHtml(report.agency)}</h1>
  <div class="meta">${escapeHtml(report.period)} · ${escapeHtml(report.type)} · Ирсэн ${escapeHtml(report.submittedAt)}</div>
  <div class="meta">Тайлангийн ID: ${escapeHtml(report.id)} · Гаргасан огноо: ${today}</div>

  <h2>Хураангуй үзүүлэлт</h2>
  <table class="metrics">
    <tr>
      <td>Нийт мөр<br/><b style="font-size:16px;color:#0f2a63;">${report.totalRows}</b></td>
      <td>Өндөр<br/><b style="font-size:16px;color:#9f1239;">${report.flagCounts.HIGH}</b></td>
      <td>Дунд<br/><b style="font-size:16px;color:#92400e;">${report.flagCounts.MEDIUM}</b></td>
      <td>Бага<br/><b style="font-size:16px;color:#334155;">${report.flagCounts.LOW}</b></td>
      <td>Шийдвэрлэсэн<br/><b style="font-size:16px;color:#065f46;">${decided} / ${report.directives.length}</b></td>
    </tr>
  </table>

  <h2>Тэмдэглэгээ бүрийн шийдвэр</h2>
  <table>
    <thead>
      <tr>
        <th style="width:110px;">Код</th>
        <th>Зорилт</th>
        <th style="width:60px;">Түвшин</th>
        <th style="width:80px;">Өөр/Дээд</th>
        <th style="width:90px;">Шийдвэр</th>
        <th style="width:180px;">Тэмдэглэл</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <p class="meta" style="margin-top:20px;">
    Тайланг УИХ Тамгын газрын дотоод самбарт AI дэмжлэгтэй шалгаж, ажилтны эцсийн шийдвэрээр баталгаажуулав.
  </p>
</body>
</html>`;

  const blob = new Blob(
    ["﻿", html],
    {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${report.id}-${today}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
