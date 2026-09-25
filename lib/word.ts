import {
  type IRunOptions,
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  UnderlineType,
  VerticalAlign,
  WidthType,
} from "docx";
import { compareWords } from "./law/compare";
import type { ChangeType, WordPart } from "./law/types";

export type WordBill = {
  title: string;
  clauses: {
    number: string;
    oldText: string | null;
    newText: string | null;
    changeType: ChangeType;
    diff?: WordPart[] | null;
  }[];
};

const FONT = "Times New Roman";
const SIZE = 22;

const TYPE_LABEL: Record<ChangeType, string> = {
  ADDED: "Нэмсэн",
  REMOVED: "Хассан",
  CHANGED: "Өөрчилсөн",
  UNCHANGED: "Өөрчлөгдөөгүй",
};

const COLS = [1300, 5800, 5800, 2498];

const run = (text: string, extra: Omit<IRunOptions, "text"> = {}) =>
  new TextRun({ text, font: FONT, size: SIZE, ...extra });

const cell = (children: Paragraph[], width: number, shaded = false) =>
  new TableCell({
    children,
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.TOP,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    ...(shaded ? { shading: { type: ShadingType.CLEAR, fill: "E7E6E6", color: "auto" } } : {}),
  });

const textCell = (text: string, width: number, opts: { bold?: boolean; shaded?: boolean } = {}) =>
  cell(
    [new Paragraph({ children: [run(text, { bold: opts.bold })] })],
    width,
    opts.shaded,
  );

function oldRuns(parts: WordPart[]): TextRun[] {
  return parts
    .filter((p) => !p.added)
    .map((p) => run(p.value, p.removed ? { strike: true } : {}));
}

function newRuns(parts: WordPart[]): TextRun[] {
  return parts
    .filter((p) => !p.removed)
    .map((p) =>
      run(p.value, p.added ? { bold: true, underline: { type: UnderlineType.SINGLE } } : {}),
    );
}

const DASH = "—";

export async function makeWordFile(bill: WordBill): Promise<Buffer> {
  const changed = bill.clauses.filter((c) => c.changeType !== "UNCHANGED");

  const header = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: [
      textCell("Заалт", COLS[0], { bold: true, shaded: true }),
      textCell("Хүчин төгөлдөр хууль", COLS[1], { bold: true, shaded: true }),
      textCell("Төсөл", COLS[2], { bold: true, shaded: true }),
      textCell("Өөрчлөлтийн төрөл", COLS[3], { bold: true, shaded: true }),
    ],
  });

  const rows = changed.map((c) => {
    const parts = c.diff?.length ? c.diff : compareWords(c.oldText, c.newText);
    return new TableRow({
      children: [
        textCell(c.number, COLS[0]),
        cell(
          [new Paragraph({ children: c.oldText == null ? [run(DASH)] : oldRuns(parts) })],
          COLS[1],
        ),
        cell(
          [new Paragraph({ children: c.newText == null ? [run(DASH)] : newRuns(parts) })],
          COLS[2],
        ),
        textCell(TYPE_LABEL[c.changeType], COLS[3]),
      ],
    });
  });

  const doc = new Document({
    creator: "Pragmatic",
    title: `${bill.title} — Харьцуулсан хүснэгт`,
    styles: { default: { document: { run: { font: FONT, size: SIZE } } } },
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE },
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new TextRun({ text: bill.title, font: FONT, size: 28, bold: true, color: "000000" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new TextRun({ text: "Харьцуулсан хүснэгт", font: FONT, size: 26, bold: true, color: "000000" }),
            ],
          }),
          new Table({
            layout: TableLayoutType.FIXED,
            width: { size: COLS.reduce((a, b) => a + b, 0), type: WidthType.DXA },
            columnWidths: COLS,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
            },
            rows: [header, ...rows],
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
