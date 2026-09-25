import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "@/lib/prisma";
import { ai as liveAi, type AiApi } from "./ai";
import { groupBillComments } from "./grouping";
import { createBill } from "./pipeline";
import { parseResults, replayAi } from "./replay";
import { STAGES, type Stage } from "./types";

export type SeedOptions = {
  dataDir?: string;
  replace?: boolean;
  live?: boolean;
  stage?: Stage;
};

export type SeedReport = {
  billId: string;
  aiSource: "data/results.json" | "live AI";
  clauses: number;
  changed: number;
  approved: number;
  needCheck: string[];
  commentsSaved: number;
  commentsSkipped: number;
  groups: number;
  filtered: number;
};

const VOTES = ["SUPPORT", "OPPOSE", "NEUTRAL"] as const;

type CommentFile = { clause: string; text: string; name?: string; vote?: string }[];

export async function seedFromFiles(opts: SeedOptions = {}): Promise<SeedReport> {
  const dir = opts.dataDir ?? "data";
  const path = (name: string) => join(dir, name);
  const read = (name: string) => readFileSync(path(name), "utf8");
  const readOpt = (name: string) => (existsSync(path(name)) ? read(name) : null);

  for (const f of ["law.txt", "bill.txt"]) {
    if (!existsSync(path(f))) throw new Error(`${path(f)} not found (Dev 2 puts the demo files in ${dir}/)`);
  }
  const bill = read("bill.txt");
  const title = (readOpt("title.txt") ?? bill.split(/\r?\n/).find((l) => l.trim()) ?? "").trim();
  if (!title) throw new Error(`No title: add ${path("title.txt")} or start ${path("bill.txt")} with a title line`);

  const stage = (opts.stage ?? readOpt("stage.txt")?.trim() ?? "DISCUSS_DECISION") as Stage;
  if (!STAGES.includes(stage)) throw new Error(`Stage must be one of ${STAGES.join(", ")}`);

  const existing = await prisma.project.findMany({ where: { title, source: "UPLOAD" }, select: { id: true } });
  if (existing.length > 0) {
    if (!opts.replace) {
      throw new Error(`A bill titled "${title}" already exists. Run again with --replace to delete and re-create it.`);
    }
    await prisma.project.deleteMany({ where: { id: { in: existing.map((p) => p.id) } } });
  }

  const resultsRaw = opts.live ? null : readOpt("results.json");
  const replay = resultsRaw ? replayAi(parseResults(resultsRaw)) : null;
  const ai: AiApi = replay ? replay.ai : liveAi;

  const { id, clauses, changed } = await createBill(
    { title, stage, currentLawText: read("law.txt"), amendmentText: bill, reasonText: readOpt("reason.txt") },
    ai,
  );

  const approved = await prisma.clause.updateMany({
    where: { projectId: id, changeType: { not: "UNCHANGED" }, applyError: false },
    data: { approved: true },
  });
  const needCheck = (
    await prisma.clause.findMany({ where: { projectId: id, applyError: true }, orderBy: { order: "asc" }, select: { number: true } })
  ).map((c) => c.number);

  const report: SeedReport = {
    billId: id,
    aiSource: replay ? "data/results.json" : "live AI",
    clauses,
    changed,
    approved: approved.count,
    needCheck,
    commentsSaved: 0,
    commentsSkipped: 0,
    groups: 0,
    filtered: 0,
  };

  const commentsRaw = readOpt("comments.json");
  if (!commentsRaw) return report;

  const items = JSON.parse(commentsRaw) as CommentFile;
  const clauseIdByNumber = new Map(
    (await prisma.clause.findMany({ where: { projectId: id }, select: { id: true, number: true } })).map((c) => [c.number, c.id]),
  );

  const idByIndex: (string | undefined)[] = [];
  for (const item of items) {
    const clauseId = clauseIdByNumber.get(String(item.clause).trim().replace(/\.+$/, ""));
    if (!clauseId || !item.text?.trim()) {
      idByIndex.push(undefined);
      report.commentsSkipped++;
      continue;
    }
    const vote = (VOTES as readonly string[]).includes(item.vote ?? "") ? (item.vote as (typeof VOTES)[number]) : "NEUTRAL";
    const saved = await prisma.comment.create({
      data: { clauseId, body: item.text.trim(), petitionerName: item.name ?? null, vote },
      select: { id: true },
    });
    idByIndex.push(saved.id);
    report.commentsSaved++;
  }
  replay?.setCommentIds(idByIndex);

  const grouped = await groupBillComments(id, ai);
  report.groups = grouped.groups;
  report.filtered = grouped.filtered;
  return report;
}
