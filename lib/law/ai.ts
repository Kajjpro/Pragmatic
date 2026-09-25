// Dev 2-ийн жинхэнэ AI функцууд (lib/ai/*). AI_STUB=true бол тэд өөрсдөө хуурамч өгөгдөл буцаана.
import { readAmendment } from "@/lib/ai/amendment";
import { explainChange } from "@/lib/ai/explain";
import { filterComments, groupComments } from "@/lib/ai/comments";
import { writeReply } from "@/lib/ai/reply";
import type { Change, Explanation, FilterStatus } from "./types";

export type CommentForGrouping = { id: string; text: string };

export type FilterVerdict = { id: string; status: FilterStatus; reason: string };

export type CommentGroup = {
  title: string;
  summary: string;
  commentIds: string[];
};

export type GroupForReply = { title: string; summary: string; comments: string[] };

export type AiApi = {
  readAmendment(amendmentText: string): Promise<Change[]>;
  explainChange(
    oldText: string | null,
    newText: string | null,
    reasonText: string,
    number?: string,
  ): Promise<Explanation>;
  filterComments(
    clauseText: string,
    comments: CommentForGrouping[],
  ): Promise<FilterVerdict[]>;
  groupComments(
    clauseText: string,
    comments: CommentForGrouping[],
  ): Promise<CommentGroup[]>;
  writeReply(clauseText: string, group: GroupForReply): Promise<string>;
};

// ── Dev 2-ийн функцуудыг Dev 1-ийн төрлүүдэд тааруулах adapter ──
// Ялгаа нь зөвхөн readAmendment (action/clause → type/number) ба writeReply (comments → examples).
const realAi: AiApi = {
  async readAmendment(amendmentText) {
    const changes = await readAmendment(amendmentText);
    const result: Change[] = [];
    for (const c of changes) {
      if (c.action === "REPLACE_WORDS") {
        result.push({
          type: "REPLACE_WORDS",
          number: c.clause,
          oldWords: c.oldWords ?? "",
          newText: c.newText ?? "",
          sourceQuote: c.sourceQuote,
        });
      } else if (c.action === "REWRITE") {
        result.push({ type: "REWRITE", number: c.clause, newText: c.newText ?? "", sourceQuote: c.sourceQuote });
      } else if (c.action === "ADD") {
        result.push({ type: "ADD", number: c.clause, newText: c.newText ?? "", sourceQuote: c.sourceQuote });
      } else {
        result.push({ type: "REMOVE", number: c.clause, sourceQuote: c.sourceQuote });
      }
    }
    return result;
  },

  explainChange(oldText, newText, reasonText) {
    return explainChange(oldText, newText, reasonText);
  },

  filterComments(clauseText, comments) {
    return filterComments(clauseText, comments);
  },

  groupComments(clauseText, comments) {
    return groupComments(clauseText, comments);
  },

  writeReply(clauseText, group) {
    return writeReply(clauseText, {
      title: group.title,
      summary: group.summary,
      examples: group.comments.slice(0, 3), // эхний 3 санал жишээ болно
    });
  },
};

export const ai: AiApi = realAi;
