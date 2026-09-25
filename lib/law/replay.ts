import type { AiApi } from "./ai";
import type { Change, Explanation, FilterStatus } from "./types";

export type Results = {
  changes: Change[];
  explanations?: Record<string, Explanation>;
  filter?: { comment: number; status: FilterStatus; reason?: string }[];
  groups?: {
    clause: string;
    title: string;
    summary: string;
    comments: number[];
    replyDraft?: string;
  }[];
};

export function parseResults(raw: string): Results {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("data/results.json is not valid JSON");
  }
  const r = data as Partial<Results> | null;
  if (!r || !Array.isArray(r.changes)) {
    throw new Error('data/results.json needs a "changes" array (what readAmendment returned)');
  }
  for (const key of ["filter", "groups"] as const) {
    if (r[key] !== undefined && !Array.isArray(r[key])) {
      throw new Error(`data/results.json: "${key}" must be an array`);
    }
  }
  return r as Results;
}

export function replayAi(results: Results) {
  let idByIndex: (string | undefined)[] = [];
  const empty: Explanation = { what: "", why: "", who: "" };

  const indexOfId = (id: string) => idByIndex.indexOf(id);

  const ai: AiApi = {
    async readAmendment() {
      return results.changes;
    },

    async explainChange(_old, _new, _reason, number) {
      return (number && results.explanations?.[number]) || empty;
    },

    async filterComments(_clauseText, comments) {
      return comments.map((c) => {
        const found = results.filter?.find((f) => f.comment === indexOfId(c.id));
        return { id: c.id, status: found?.status ?? "RELEVANT", reason: found?.reason ?? "" };
      });
    },

    async groupComments(_clauseText, comments) {
      const here = new Set(comments.map((c) => c.id));
      return (results.groups ?? [])
        .map((g) => ({
          title: g.title,
          summary: g.summary,
          commentIds: g.comments
            .map((i) => idByIndex[i])
            .filter((id): id is string => id !== undefined && here.has(id)),
        }))
        .filter((g) => g.commentIds.length > 0);
    },

    async writeReply(_clauseText, group) {
      const found = results.groups?.find((g) => g.title === group.title && g.summary === group.summary);
      return found?.replyDraft ?? "";
    },
  };

  return {
    ai,
    setCommentIds(ids: (string | undefined)[]) {
      idByIndex = ids;
    },
  };
}
