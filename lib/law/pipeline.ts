import type { Prisma } from "@/app/generated/prisma/client";
import { ai as defaultAi, type AiApi } from "./ai";
import { applyChanges } from "./apply";
import { compareWords } from "./compare";
import { splitIntoClauses } from "./split";
import { BadInputError, type ClauseResult, type Stage, type WordPart } from "./types";

export { BadInputError };

export type BillInput = {
  title: string;
  stage?: Stage;
  currentLawText: string;
  amendmentText: string;
  reasonText?: string | null;
};

export type BuiltClause = ClauseResult & {
  order: number;
  diff: WordPart[];
  what: string | null;
  why: string | null;
  who: string | null;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const aiDelay = () => Number(process.env.AI_CALL_DELAY_MS ?? 0) || 0;

export async function buildClauses(
  input: Pick<BillInput, "currentLawText" | "amendmentText" | "reasonText">,
  ai: AiApi = defaultAi,
): Promise<BuiltClause[]> {
  const oldClauses = splitIntoClauses(input.currentLawText);
  if (oldClauses.length === 0) {
    throw new BadInputError(
      "Хүчин төгөлдөр хуулийн текстийг заалтаар хувааж чадсангүй (зүйл, заалтын дугаар олдсонгүй).",
    );
  }

  const changes = await ai.readAmendment(input.amendmentText);
  const results = applyChanges(oldClauses, changes);

  const built: BuiltClause[] = [];
  let first = true;
  for (const [order, r] of results.entries()) {
    if (r.changeType === "UNCHANGED") {
      built.push({ ...r, order, diff: [], what: null, why: null, who: null });
      continue;
    }

    const diff = compareWords(r.oldText, r.newText);
    let what: string | null = null;
    let why: string | null = null;
    let who: string | null = null;
    try {
      if (!first && aiDelay()) await sleep(aiDelay());
      first = false;
      const e = await ai.explainChange(r.oldText, r.newText, input.reasonText ?? "", r.number);
      what = e.what || null;
      why = e.why || null;
      who = e.who || null;
    } catch (err) {
      console.error(`explainChange failed for clause ${r.number}:`, err);
    }
    built.push({ ...r, order, diff, what, why, who });
  }
  return built;
}

export async function createBill(
  input: BillInput,
  ai: AiApi = defaultAi,
): Promise<{ id: string; clauses: number; changed: number }> {
  if (!input.amendmentText.trim()) {
    throw new BadInputError("Төслийн текст хоосон байна.");
  }
  const built = await buildClauses(input, ai);

  const { prisma } = await import("@/lib/prisma");
  const project = await prisma.project.create({
    data: {
      title: input.title,
      source: "UPLOAD",
      stage: input.stage ?? "DISCUSS_DECISION",
      currentLawText: input.currentLawText,
      amendmentText: input.amendmentText,
      reasonText: input.reasonText ?? null,
      clauses: {
        createMany: {
          data: built.map((c) => ({
            number: c.number,
            order: c.order,
            oldText: c.oldText,
            newText: c.newText,
            changeType: c.changeType,
            diff: c.diff as unknown as Prisma.InputJsonValue,
            sourceQuote: c.sourceQuote,
            applyError: c.applyError,
            what: c.what,
            why: c.why,
            who: c.who,
          })),
        },
      },
    },
    select: { id: true },
  });

  return {
    id: project.id,
    clauses: built.length,
    changed: built.filter((c) => c.changeType !== "UNCHANGED").length,
  };
}
