import { stubAi } from "./ai-stub";
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

export const ai: AiApi = stubAi;
