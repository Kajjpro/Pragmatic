import type { AiApi } from "./ai";

export const stubAi: AiApi = {
  async readAmendment() {
    throw new Error(
      "readAmendment is not connected yet: replace stubAi in lib/law/ai.ts with Dev 2's lib/ai functions.",
    );
  },

  async explainChange() {
    return { what: "", why: "", who: "" };
  },

  async filterComments(_clauseText, comments) {
    return comments.map((c) => ({ id: c.id, status: "RELEVANT" as const, reason: "" }));
  },

  async groupComments(_clauseText, comments) {
    if (comments.length === 0) return [];
    return [
      {
        title: comments[0].text.slice(0, 60),
        summary: `${comments.length} санал`,
        commentIds: comments.map((c) => c.id),
      },
    ];
  },

  async writeReply() {
    return "";
  },
};
