// scripts/apply-review.ts
// data/review.md дээрх гар засваруудыг data/precomputed.json-д оруулж, дараа нь бүгдийг дахин шалгана.
//   - "Засвар" багана хоосон бол тэр талбарыг өөрчлөхгүй.
//   - ❌ тавьсан ч засвар бичээгүй мөрийг жагсааж анхааруулна.
// Ажиллуулах: npx tsx scripts/apply-review.ts            (data/ хавтас)
//             npx tsx scripts/apply-review.ts --dir=хавтас

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Persona } from "../lib/ai/card";
import {
  textToOptions,
  validatePrecomputed,
  type Precomputed,
  type PrecomputedCard,
  type PrecomputedGroup,
  type PrecomputedVoteEvent,
} from "../lib/ai/precomputed";

const dirArg = process.argv.find((a) => a.startsWith("--dir="));
const DIR = dirArg ? dirArg.split("=")[1] : "data";
const PERSONAS: Persona[] = ["STUDENT", "DRIVER", "WORKER", "PARENT", "ALL"];
const BACKUP_ORDER = 999; // нөөц картын дараалал (сайтад харагдахгүй)

const data: Precomputed = JSON.parse(readFileSync(join(DIR, "precomputed.json"), "utf8"));
const review = readFileSync(join(DIR, "review.md"), "utf8");

const applied: string[] = []; // хийсэн засварууд
const errors: string[] = []; // хэрэглэж чадаагүй засварууд
const flaggedWithoutEdit: string[] = []; // ❌ боловч засваргүй
const deleteKeys: string[] = [];

// ── Хүснэгтийн мөрийг нүднүүд болгоно. "\|" нь нүдний доторх "|" тул хуваахгүй. ──
function splitRow(line: string): string[] {
  const cells = line.split(/(?<!\\)\|/).slice(1, -1);
  return cells.map((c) => c.trim().replace(/\\\|/g, "|"));
}

// ── Нэг картын нэг талбарт засвар хийнэ ──
function editCard(card: PrecomputedCard, field: string, edit: string) {
  const where = `${card.key} ${field}`;
  if (field === "hook" || field === "youMeaning" || field === "emoji") {
    card[field] = edit;
  } else if (field === "order") {
    const order = Number(edit);
    if (!Number.isInteger(order)) {
      errors.push(`${where}: "${edit}" тоо биш`);
      return;
    }
    card.order = order;
  } else if (field === "personas") {
    const names = edit.split(",").map((p) => p.trim().toUpperCase());
    const personas = PERSONAS.filter((p) => names.includes(p));
    if (personas.length !== names.length) {
      errors.push(`${where}: "${edit}" — зөвхөн ${PERSONAS.join(", ")}`);
      return;
    }
    card.personas = personas.includes("ALL") ? ["ALL"] : personas;
  } else if (field === "delete") {
    if (edit.toLowerCase() === "тийм") {
      deleteKeys.push(card.key);
    }
  } else {
    // q1.question, q2.options, q3.explanation
    const match = field.match(/^q(\d)\.(question|options|explanation)$/);
    const question = match ? card.quiz[Number(match[1]) - 1] : undefined;
    if (!match || !question) {
      errors.push(`${where}: ийм талбар алга`);
      return;
    }
    if (match[2] === "options") {
      const parsed = textToOptions(edit);
      if (parsed === null) {
        errors.push(`${where}: зөв хариултын урд яг нэг ✔ тавина уу`);
        return;
      }
      question.options = parsed.options;
      question.correctIndex = parsed.correctIndex;
    } else if (match[2] === "question") {
      question.question = edit;
    } else {
      question.explanation = edit;
    }
  }
  applied.push(where);
}

// ── Нэг таамгийн засвар: hook, эсвэл use (тийм = сайтад, үгүй = нөөц) ──
function editVoteEvent(event: PrecomputedVoteEvent, field: string, edit: string) {
  const where = `vote-${event.agendaCode} ${field}`;
  if (field === "hook") {
    event.hook = edit;
  } else if (field === "use") {
    const main = data.voteEvents.filter((e) => e !== event);
    const backup = (data.backupVoteEvents || []).filter((e) => e !== event);
    if (edit.toLowerCase() === "тийм") {
      main.push(event);
    } else {
      backup.push(event);
    }
    data.voteEvents = main;
    data.backupVoteEvents = backup;
  } else {
    errors.push(`${where}: ийм талбар алга`);
    return;
  }
  applied.push(where);
}

// ── Нэг бүлгийн нэг талбарт засвар хийнэ ──
function editGroup(group: PrecomputedGroup, field: string, edit: string) {
  const where = `${group.key} ${field}`;
  if (field === "title") {
    group.title = edit;
  } else if (field === "replyDraft") {
    group.replyDraft = edit;
  } else if (field === "demo") {
    // Демод зөвхөн нэг бүлэг "Тусгасан" болно
    const isDemo = edit.toLowerCase() === "тийм";
    if (isDemo) {
      for (const other of data.groups) {
        other.demoReflectable = false;
      }
    }
    group.demoReflectable = isDemo;
  } else {
    errors.push(`${where}: ийм талбар алга`);
    return;
  }
  applied.push(where);
}

// ── review.md-ийг мөр мөрөөр уншина ──
let currentCard: PrecomputedCard | undefined;
let currentGroup: PrecomputedGroup | undefined;
let currentEvent: PrecomputedVoteEvent | undefined;
const allCards = [...data.cards, ...(data.backupCards || [])];
const allEvents = [...data.voteEvents, ...(data.backupVoteEvents || [])];

for (const line of review.split("\n")) {
  // "## demo-35.1 · ⏰ ..." → карт, "### g1 · 14.2 · ..." → бүлэг
  const heading = line.match(/^(##|###) (\S+) ·/);
  if (heading) {
    currentCard = heading[1] === "##" ? allCards.find((c) => c.key === heading[2]) : undefined;
    currentGroup = heading[1] === "###" ? data.groups.find((g) => g.key === heading[2]) : undefined;
    currentEvent = heading[1] === "###" ? allEvents.find((e) => `vote-${e.agendaCode}` === heading[2]) : undefined;
    continue;
  }
  if (line.startsWith("# ") || line.startsWith("## ")) {
    currentCard = undefined;
    currentGroup = undefined;
    currentEvent = undefined;
    continue;
  }
  if (!line.startsWith("|") || line.startsWith("|---") || line.startsWith("| Талбар") || line.startsWith("| Санал")) {
    continue;
  }

  const cells = splitRow(line);
  const field = cells[0];
  const verdict = cells[cells.length - 2];
  const edit = cells[cells.length - 1];
  const owner = currentCard?.key || currentGroup?.key || (currentEvent ? `vote-${currentEvent.agendaCode}` : undefined);
  if (!owner) {
    continue;
  }

  if (edit === "") {
    if (verdict.includes("❌")) {
      flaggedWithoutEdit.push(`${owner} ${field}`);
    }
    continue;
  }
  if (currentCard) {
    editCard(currentCard, field, edit);
  } else if (currentGroup) {
    editGroup(currentGroup, field, edit);
  } else if (currentEvent) {
    editVoteEvent(currentEvent, field, edit);
  }
}

// ── Устгах картуудыг хасна. order < 999 бол сайтад, 999 бол нөөц. Дарааллыг 1, 2, 3... болгоно. ──
const kept = allCards.filter((c) => !deleteKeys.includes(c.key));
data.cards = kept
  .filter((c) => c.order < BACKUP_ORDER)
  .sort((a, b) => a.order - b.order)
  .map((c, index) => ({ ...c, order: index + 1 }));
data.backupCards = kept.filter((c) => c.order >= BACKUP_ORDER).map((c) => ({ ...c, order: BACKUP_ORDER }));

// ── Шалгаад хадгална ──
console.log(`✓ ${applied.length} засвар хийгдлээ${applied.length ? ": " + applied.join(", ") : ""}`);
if (deleteKeys.length > 0) {
  console.log(`✓ ${deleteKeys.length} карт устгагдлаа: ${deleteKeys.join(", ")}`);
}
for (const error of errors) {
  console.log(`✗ ${error}`);
}
for (const flagged of flaggedWithoutEdit) {
  console.log(`⚠ ${flagged}: ❌ тавьсан ч засвар бичээгүй`);
}

const problems = validatePrecomputed(data);
for (const problem of problems) {
  console.log(`✗ ${problem}`);
}
if (data.cards.length < 12 || data.cards.length > 18) {
  console.log(`⚠ ${data.cards.length} карт (зорилго 12–18)`);
}

writeFileSync(join(DIR, "precomputed.json"), JSON.stringify(data, null, 2) + "\n");
console.log(
  `→ ${join(DIR, "precomputed.json")} хадгалагдлаа (${data.cards.length} карт, ${data.voteEvents.length} таамаг; нөөц: ${data.backupCards.length} карт, ${(data.backupVoteEvents || []).length} таамаг)`
);
if (problems.length > 0 || errors.length > 0) {
  process.exit(1);
}
