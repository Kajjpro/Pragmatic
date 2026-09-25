import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import JSZip from "jszip";
import { makeWordFile } from "../word";
import { applyChanges, compareNumbers } from "./apply";
import { compareWords } from "./compare";
import { splitIntoClauses, splitWithPreamble } from "./split";
import type { RawClause, WordPart } from "./types";

const sample = readFileSync(new URL("./fixtures/sample-law.txt", import.meta.url), "utf8");
const numbers = (cs: { number: string }[]) => cs.map((c) => c.number);

test("split: articles, clauses and sub-clauses become separate clauses", () => {
  const clauses = splitIntoClauses(sample);
  assert.deepEqual(numbers(clauses), [
    "1", "1.1", "2", "2.1", "2.1.1", "2.1.2", "2.2", "3", "4", "4.1", "4.9", "4.10",
  ]);
});

test("split: article keeps its title", () => {
  const c = splitIntoClauses(sample);
  assert.equal(c.find((x) => x.number === "1")?.text, "Хуулийн зорилт");
});

test("split: unnumbered text under an article stays with the article (a date is not a clause number)", () => {
  const art3 = splitIntoClauses(sample).find((x) => x.number === "3");
  assert.match(art3!.text, /^Хугацаа Энэ зүйлд заасан хугацааг ажлын өдрөөр тооцно\./);
  assert.match(art3!.text, /2024\.05\.01\. өдрөөс/);
});

test("split: wording is kept, line breaks collapse to one space", () => {
  const c = splitIntoClauses(sample).find((x) => x.number === "4.10");
  assert.equal(c?.text, "Аравдугаар заалт мөр завсарласан урт текст байна.");
});

test("split: text before the first marker is reported, not lost", () => {
  const { preamble } = splitWithPreamble(sample);
  assert.match(preamble, /^ТЕСТИЙН ХУУЛЬ/);
});

test("split: handles Windows line endings", () => {
  const c = splitIntoClauses("1 дүгээр зүйл.А\r\n1.1.Б\r\n1.2.В");
  assert.deepEqual(c, [
    { number: "1", text: "А" },
    { number: "1.1", text: "Б" },
    { number: "1.2", text: "В" },
  ]);
});

const flat = (parts: WordPart[]) =>
  parts.map((p) => (p.added ? "+" : p.removed ? "-" : "=") + p.value);

test("compare: the mentor's example 'байна -> байж болно' is exactly one word swapped", () => {
  const parts = compareWords("Энэ нь хуулийн дагуу байна.", "Энэ нь хуулийн дагуу байж болно.");
  assert.deepEqual(flat(parts), ["=Энэ нь хуулийн дагуу ", "-байна", "+байж болно", "=."]);
});

test("compare: a suffix change highlights the whole word, not letters", () => {
  const parts = compareWords("Иргэн эрхтэй.", "Иргэн эрхгүй.");
  assert.deepEqual(flat(parts), ["=Иргэн ", "-эрхтэй", "+эрхгүй", "=."]);
});

test("compare: punctuation-only change is visible", () => {
  const parts = compareWords("гаргана, мөн", "гаргана. мөн");
  assert.deepEqual(flat(parts), ["=гаргана", "-,", "+.", "= мөн"]);
});

test("compare: one side missing gives a single added/removed part", () => {
  assert.deepEqual(compareWords(null, "шинэ"), [{ value: "шинэ", added: true }]);
  assert.deepEqual(compareWords("хуучин", null), [{ value: "хуучин", removed: true }]);
  assert.deepEqual(compareWords(null, null), []);
});

test("compare: identical text has no added/removed parts", () => {
  const parts = compareWords("Ижил текст байна.", "Ижил текст байна.");
  assert.ok(parts.every((p) => !p.added && !p.removed));
});

test("compare: rebuilding old and new from the parts always gives the original texts", () => {
  const pairs: [string, string][] = [
    ["Ажил олгогч нь ажилтанд цалин олгоно.", "Ажил олгогч нь ажилтанд цалин, нэмэгдэл олгож болно."],
    ["Хугацаа 30 хоног байна.", "Хугацаа 45 хоног байна."],
    ["А Б В Г", "Г В Б А"],
    ["Нэг", "Нэг хоёр гурав"],
    ["Нэг хоёр гурав", "Нэг"],
    ["Хууль зөрчсөн этгээд хариуцлага хүлээнэ.", "Хууль зөрчсөн этгээд, түүний захирал хариуцлага хүлээнэ."],
  ];
  for (const [a, b] of pairs) {
    const parts = compareWords(a, b);
    const rebuiltOld = parts.filter((p) => !p.added).map((p) => p.value).join("");
    const rebuiltNew = parts.filter((p) => !p.removed).map((p) => p.value).join("");
    assert.equal(rebuiltOld, a);
    assert.equal(rebuiltNew, b);
  }
});

const law: RawClause[] = [
  { number: "3", text: "Зорилт" },
  { number: "3.1", text: "Ажил олгогч нь цалин олгоно." },
  { number: "3.2", text: "Хугацаа 30 хоног байна." },
  { number: "3.9", text: "Есдүгээр." },
  { number: "4", text: "Хариуцлага" },
  { number: "4.1", text: "Энэ нь дүрэм байна. Тэр нь дүрэм байна." },
];
const byNumber = (rs: ReturnType<typeof applyChanges>, n: string) => rs.find((r) => r.number === n)!;

test("apply: untouched clauses are UNCHANGED and order is kept", () => {
  const r = applyChanges(law, []);
  assert.deepEqual(numbers(r), numbers(law));
  assert.ok(r.every((x) => x.changeType === "UNCHANGED" && !x.applyError));
});

test("apply: REPLACE_WORDS swaps only those words", () => {
  const r = applyChanges(law, [
    { type: "REPLACE_WORDS", number: "3.2", oldWords: "30 хоног", newText: "45 хоног", sourceQuote: "«30 хоног» гэснийг «45 хоног» гэж" },
  ]);
  const c = byNumber(r, "3.2");
  assert.equal(c.newText, "Хугацаа 45 хоног байна.");
  assert.equal(c.oldText, "Хугацаа 30 хоног байна.");
  assert.equal(c.changeType, "CHANGED");
  assert.equal(c.applyError, false);
  assert.equal(c.sourceQuote, "«30 хоног» гэснийг «45 хоног» гэж");
});

test("apply: '$&' in the replacement is inserted literally", () => {
  const r = applyChanges(law, [{ type: "REPLACE_WORDS", number: "3.2", oldWords: "30 хоног", newText: "$& хоног" }]);
  assert.equal(byNumber(r, "3.2").newText, "Хугацаа $& хоног байна.");
});

test("apply: words not found -> clause kept as is, CHANGED, applyError", () => {
  const r = applyChanges(law, [{ type: "REPLACE_WORDS", number: "3.2", oldWords: "60 хоног", newText: "90 хоног" }]);
  const c = byNumber(r, "3.2");
  assert.equal(c.newText, c.oldText);
  assert.equal(c.changeType, "CHANGED");
  assert.equal(c.applyError, true);
});

test("apply: words that appear twice are applied to the first and flagged", () => {
  const r = applyChanges(law, [{ type: "REPLACE_WORDS", number: "4.1", oldWords: "дүрэм байна", newText: "журам байна" }]);
  const c = byNumber(r, "4.1");
  assert.equal(c.newText, "Энэ нь журам байна. Тэр нь дүрэм байна.");
  assert.equal(c.applyError, true);
});

test("apply: unknown clause number is flagged, nothing is invented in existing clauses", () => {
  const r = applyChanges(law, [{ type: "REPLACE_WORDS", number: "9.9", oldWords: "а", newText: "б" }]);
  assert.equal(byNumber(r, "9.9").applyError, true);
  assert.equal(byNumber(r, "9.9").changeType, "CHANGED");
  assert.ok(r.filter((x) => x.number !== "9.9").every((x) => x.changeType === "UNCHANGED"));
});

test("apply: REWRITE replaces the whole clause", () => {
  const r = applyChanges(law, [{ type: "REWRITE", number: "3.1", newText: "Ажил олгогч цалинг сар бүр олгоно." }]);
  assert.equal(byNumber(r, "3.1").newText, "Ажил олгогч цалинг сар бүр олгоно.");
  assert.equal(byNumber(r, "3.1").changeType, "CHANGED");
});

test("apply: REMOVE sets newText to null", () => {
  const r = applyChanges(law, [{ type: "REMOVE", number: "3.9" }]);
  const c = byNumber(r, "3.9");
  assert.equal(c.newText, null);
  assert.equal(c.changeType, "REMOVED");
  assert.equal(c.applyError, false);
});

test("apply: ADD goes into the right place by clause number", () => {
  const r = applyChanges(law, [
    { type: "ADD", number: "3.3", newText: "Шинэ заалт." },
    { type: "ADD", number: "3.10", newText: "Аравдугаар шинэ." },
  ]);
  assert.deepEqual(numbers(r), ["3", "3.1", "3.2", "3.3", "3.9", "3.10", "4", "4.1"]);
  assert.equal(byNumber(r, "3.3").changeType, "ADDED");
  assert.equal(byNumber(r, "3.3").oldText, null);
});

test("apply: ADD of a number that already exists is flagged", () => {
  const r = applyChanges(law, [{ type: "ADD", number: "3.1", newText: "Давхардсан." }]);
  assert.equal(r.filter((x) => x.number === "3.1").length, 2);
  assert.ok(r.filter((x) => x.number === "3.1").some((x) => x.applyError));
});

test("apply: several changes on one clause are applied in order", () => {
  const r = applyChanges(law, [
    { type: "REPLACE_WORDS", number: "3.2", oldWords: "30 хоног", newText: "45 хоног", sourceQuote: "а" },
    { type: "REPLACE_WORDS", number: "3.2", oldWords: "45 хоног", newText: "60 хоног", sourceQuote: "б" },
  ]);
  const c = byNumber(r, "3.2");
  assert.equal(c.newText, "Хугацаа 60 хоног байна.");
  assert.equal(c.oldText, "Хугацаа 30 хоног байна.");
  assert.equal(c.applyError, false);
  assert.equal(c.sourceQuote, "а\nб");
});

test("apply: a later change cannot use words an earlier change already replaced", () => {
  const r = applyChanges(law, [
    { type: "REPLACE_WORDS", number: "3.2", oldWords: "30 хоног", newText: "45 хоног" },
    { type: "REPLACE_WORDS", number: "3.2", oldWords: "30 хоног", newText: "60 хоног" },
  ]);
  assert.equal(byNumber(r, "3.2").applyError, true);
  assert.equal(byNumber(r, "3.2").newText, "Хугацаа 45 хоног байна.");
});

test("apply: clause numbers from the AI with a trailing dot or spaces still match", () => {
  const r = applyChanges(law, [{ type: "REMOVE", number: " 3.9. " }]);
  assert.equal(byNumber(r, "3.9").changeType, "REMOVED");
});

test("compareNumbers sorts by value, not by text", () => {
  assert.ok(compareNumbers("3.9", "3.10") < 0);
  assert.ok(compareNumbers("3", "3.1") < 0);
  assert.ok(compareNumbers("4", "3.99") > 0);
  assert.equal(compareNumbers("2.1", "2.1"), 0);
});

async function documentXml(buf: Buffer) {
  const zip = await JSZip.loadAsync(buf);
  return zip.file("word/document.xml")!.async("string");
}

const wordBill = {
  title: "Хөдөлмөрийн тухай хуульд өөрчлөлт оруулах тухай",
  clauses: [
    { number: "3.1", oldText: "Ажил олгогч нь цалин олгоно.", newText: "Ажил олгогч нь цалин олгож болно.", changeType: "CHANGED" as const, diff: compareWords("Ажил олгогч нь цалин олгоно.", "Ажил олгогч нь цалин олгож болно.") },
    { number: "3.2", oldText: "Хэвээр үлдэх заалт.", newText: "Хэвээр үлдэх заалт.", changeType: "UNCHANGED" as const, diff: [] },
    { number: "3.3", oldText: null, newText: "Шинэ заалт.", changeType: "ADDED" as const, diff: compareWords(null, "Шинэ заалт.") },
    { number: "3.4", oldText: "Хасагдах заалт.", newText: null, changeType: "REMOVED" as const, diff: compareWords("Хасагдах заалт.", null) },
  ],
};

test("word: a real .docx with title, 4 columns, landscape page", async () => {
  const buf = await makeWordFile(wordBill);
  assert.equal(buf.subarray(0, 2).toString(), "PK");
  const xml = await documentXml(buf);
  assert.match(xml, /Харьцуулсан хүснэгт/);
  for (const h of ["Заалт", "Хүчин төгөлдөр хууль", "Төсөл", "Өөрчлөлтийн төрөл"]) assert.ok(xml.includes(h), h);
  assert.match(xml, /w:orient="landscape"/);
});

test("word: only changed clauses are listed", async () => {
  const xml = await documentXml(await makeWordFile(wordBill));
  assert.ok(xml.includes("Шинэ заалт."));
  assert.ok(xml.includes("Хасагдах заалт."));
  assert.ok(!xml.includes("Хэвээр үлдэх заалт."));
});

test("word: removed words are struck through, added words are bold + underlined", async () => {
  const xml = await documentXml(await makeWordFile(wordBill));
  const runs = xml.match(/<w:r>[\s\S]*?<\/w:r>/g) ?? [];
  const strike = runs.filter((r) => r.includes("<w:strike"));
  const added = runs.filter((r) => r.includes("<w:b/>") && r.includes("<w:u "));
  assert.ok(strike.some((r) => r.includes("олгоно")), "removed word 'олгоно' must be struck through");
  assert.ok(added.some((r) => r.includes("олгож болно")), "added words must be bold + underlined");
  assert.ok(!strike.some((r) => r.includes("Ажил олгогч")));
});
