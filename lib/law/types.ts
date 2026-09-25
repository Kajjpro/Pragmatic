export type WordPart = { value: string; added?: boolean; removed?: boolean };

export type RawClause = { number: string; text: string };

export type Change =
  | {
      type: "REPLACE_WORDS";
      number: string;
      oldWords: string;
      newText: string;
      sourceQuote?: string;
    }
  | { type: "REWRITE"; number: string; newText: string; sourceQuote?: string }
  | { type: "ADD"; number: string; newText: string; sourceQuote?: string }
  | { type: "REMOVE"; number: string; sourceQuote?: string };

export type ChangeType = "ADDED" | "REMOVED" | "CHANGED" | "UNCHANGED";

export const STAGES = ["DISCUSS_DECISION", "FIRST_READING", "FINAL_READING", "FINAL_APPROVAL"] as const;
export type Stage = (typeof STAGES)[number];

export type FilterStatus = "RELEVANT" | "OFF_TOPIC" | "ABUSIVE" | "DUPLICATE";

export type ClauseResult = {
  number: string;
  oldText: string | null;
  newText: string | null;
  changeType: ChangeType;
  sourceQuote: string | null;
  applyError: boolean;
};

export type Explanation = { what: string; why: string; who: string };
