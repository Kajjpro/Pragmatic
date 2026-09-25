import type { RawClause } from "./types";

const ARTICLE = /^[ \t]*(\d{1,4})[ \t]*(?:-\s*р|дүгээр|дугаар)[ \t]+зүйл[ \t]*\.(.*)$/u;
const CLAUSE = /^[ \t]*(\d{1,3}(?:\.\d{1,3})+)\.(?!\d)(.*)$/u;

const squash = (s: string) => s.replace(/\s+/g, " ").trim();

export function splitWithPreamble(text: string): {
  preamble: string;
  clauses: RawClause[];
} {
  const clauses: RawClause[] = [];
  const preamble: string[] = [];
  let current: { number: string; parts: string[] } | null = null;

  const flush = () => {
    if (current) clauses.push({ number: current.number, text: squash(current.parts.join(" ")) });
  };

  for (const line of text.split(/\r?\n/)) {
    const article = ARTICLE.exec(line);
    if (article) {
      flush();
      current = { number: article[1], parts: [article[2]] };
      continue;
    }
    const clause = CLAUSE.exec(line);
    if (clause) {
      flush();
      current = { number: clause[1], parts: [clause[2]] };
      continue;
    }
    if (current) current.parts.push(line);
    else preamble.push(line);
  }
  flush();

  return { preamble: squash(preamble.join(" ")), clauses };
}

export function splitIntoClauses(text: string): RawClause[] {
  return splitWithPreamble(text).clauses;
}
