import { existsSync, readFileSync } from "node:fs";
import { splitWithPreamble } from "../lib/law/split";

const real = "data/law.txt";
const fixture = "lib/law/fixtures/sample-law.txt";
const path = process.argv[2] ?? (existsSync(real) ? real : fixture);
if (path === fixture) {
  console.log(`(no ${real} yet, using the small test sample: ${fixture})\n`);
}

const { preamble, clauses } = splitWithPreamble(readFileSync(path, "utf8"));

console.log(`file:    ${path}`);
console.log(`clauses: ${clauses.length}`);
console.log(`articles (no dot in number): ${clauses.filter((c) => !c.number.includes(".")).length}\n`);

for (const c of clauses.slice(0, 5)) {
  const t = c.text.length > 110 ? c.text.slice(0, 110) + "…" : c.text;
  console.log(`  ${c.number.padEnd(8)} ${t}`);
}

const seen = new Map<string, number>();
for (const c of clauses) seen.set(c.number, (seen.get(c.number) ?? 0) + 1);
const dupes = [...seen].filter(([, n]) => n > 1).map(([num, n]) => `${num} ×${n}`);
const empty = clauses.filter((c) => c.text === "").map((c) => c.number);

console.log("");
if (preamble) console.log(`⚠ ${preamble.length} characters before the first clause were not included: "${preamble.slice(0, 80)}…"`);
if (dupes.length) console.log(`⚠ repeated clause numbers: ${dupes.join(", ")}`);
if (empty.length) console.log(`⚠ clauses with no text: ${empty.join(", ")}`);
if (!preamble && !dupes.length && !empty.length) console.log("✓ no warnings");
