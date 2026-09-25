import { diffArrays } from "diff";
import type { WordPart } from "./types";

const segmenter = new Intl.Segmenter("mn", { granularity: "word" });

const tokenize = (text: string) =>
  Array.from(segmenter.segment(text), (s) => s.segment);

type Op = { kind: "eq" | "del" | "ins"; text: string };

const isSpace = (s: string) => /^\s+$/.test(s);

export function compareWords(
  oldText: string | null,
  newText: string | null,
): WordPart[] {
  if (oldText == null && newText == null) return [];
  if (oldText == null) return [{ value: newText as string, added: true }];
  if (newText == null) return [{ value: oldText, removed: true }];

  let ops: Op[] = diffArrays(tokenize(oldText), tokenize(newText)).map((p) => ({
    kind: p.added ? "ins" : p.removed ? "del" : "eq",
    text: p.value.join(""),
  }));

  ops = ops.flatMap((op, i): Op[] =>
    op.kind === "eq" &&
    isSpace(op.text) &&
    i > 0 &&
    i < ops.length - 1 &&
    ops[i - 1].kind !== "eq" &&
    ops[i + 1].kind !== "eq"
      ? [
          { kind: "del", text: op.text },
          { kind: "ins", text: op.text },
        ]
      : [op],
  );

  const parts: WordPart[] = [];
  let del = "";
  let ins = "";
  const flush = () => {
    if (del) parts.push({ value: del, removed: true });
    if (ins) parts.push({ value: ins, added: true });
    del = ins = "";
  };
  for (const op of ops) {
    if (op.kind === "del") del += op.text;
    else if (op.kind === "ins") ins += op.text;
    else {
      flush();
      parts.push({ value: op.text });
    }
  }
  flush();
  return parts;
}
