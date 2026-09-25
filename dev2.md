# DEV 2 — AI + demo data (Kajusi)

> Товчхондоо: Чи 4 AI функц хийнэ: ойлгох (`readAmendment`), тайлбарлах (`explainChange`), бүлэглэх (`groupComments`), хариулах (`writeReply`). Мөн демо өгөгдөл бэлтгэнэ. Хамгийн чухал нь `readAmendment` — энэ буруу бол бүх харьцуулалт буруу болно.

Read `CLAUDE.md` first.

## Your files

`lib/ai/client.ts` (done), `lib/ai/amendment.ts`, `lib/ai/explain.ts`, `lib/ai/comments.ts`, `lib/ai/reply.ts`, `scripts/test-*.ts`, `scripts/import-comments.ts`, `data/`
(`lib/ai/review.ts` is from the dropped idea — delete it.)

## AI rules

1. Only `client.ts` talks to Gemini. Everything else calls `askGeminiJSON(prompt)`.
2. Stub mode: if `process.env.AI_STUB === "true"` return fake data, no Gemini call.
3. No fabrication: `sourceQuote` must be in the input verbatim (`text.includes(quote)`), otherwise drop the item. `why` only from `reasonText`, else "Шалтгааныг төсөлд дурдаагүй."
4. Output in plain Mongolian (high-school level), neutral, no political opinions.
5. Check the shape of AI output in code; if wrong, return empty instead of crashing.
6. Code must be simple with Mongolian comments. I must understand every line.

## Task 0 — Pick the demo law (together, first 30 min)

Find ONE law with all three:

- current text on legalinfo.mn
- an amendment bill on lawforum.parliament.mn (ideally with a tiny word change like "байна → байж болно")
- the bill's explanatory note (танилцуулга / үзэл баримтлал) — source of "why"
  Prefer 5–15 changes and a topic citizens understand.
  Save as `data/law.txt`, `data/bill.txt`, `data/reason.txt`.

## Task 1 — Stubs for all 4 functions (30 min) → push → tell Dev 1 and Dev 3

## Task 2 — `readAmendment` (hours 1–4) — HIGHEST PRIORITY

File: `lib/ai/amendment.ts`

```ts
export type Change = {
  action: "ADD" | "REMOVE" | "REPLACE_WORDS" | "REWRITE";
  clause: string; // "3.1"
  oldWords?: string; // REPLACE_WORDS only
  newText?: string; // new words (REPLACE_WORDS) or full new clause (ADD / REWRITE)
  sourceQuote: string; // exact sentence from the bill
};
export async function readAmendment(billText: string): Promise<Change[]>;
```

Phrasings to recognize (put these as examples in the prompt):
| Bill says | action |
|---|---|
| "...гэснийг ...гэж өөрчилсүгэй" | REPLACE_WORDS |
| "...дахь хэсгийг доор дурдсанаар өөрчлөн найруулсугай" | REWRITE |
| "...дараах агуулгатай ... дахь хэсэг нэмсүгэй" | ADD |
| "...хүчингүй болсонд тооцсугай" | REMOVE |

Tips:

- One bill sentence can contain several changes → return several items.
- Keep `oldWords` and `newText` exactly as written (no rephrasing, keep quotes/punctuation removed only if they are the bill's quote marks).
- After AI returns, drop items whose `sourceQuote` is not in `billText`.
- If the bill is long, send it article by article.

Test: `scripts/test-read-amendment.ts` → run on `data/bill.txt`, print each change. **Check every item by hand.** Write accuracy in `data/accuracy.md` (e.g. "18/20 зөв"). Use real numbers only.

**Fallback (if accuracy is bad at hour 4):** `readAmendmentFallback(lawText, billText)` → AI returns `{ number, oldText, newText }[]` directly. Dev 1 then only runs `compareWords`.

## Task 3 — `explainChange` (hours 4–6)

File: `lib/ai/explain.ts`

```ts
export async function explainChange(
  oldText: string | null,
  newText: string | null,
  reasonText: string
): Promise<{ what: string; why: string; who: string }>;
```

- `what`: one sentence, what changed in plain words.
- `why`: only from `reasonText`; else "Шалтгааныг төсөлд дурдаагүй."
- `who`: which groups are affected (e.g. "Жолооч нар", "Аж ахуйн нэгжүүд", "Бүх иргэд").

## Task 4 — `groupComments` + `writeReply` (hours 6–8)

File: `lib/ai/comments.ts`

```ts
export async function groupComments(
  clauseText: string,
  comments: { id: string; text: string }[]
): Promise<{ title: string; summary: string; commentIds: string[] }[]>;
```

- 2–5 groups, title ≤ 6 words, every comment in exactly one group.
- In code: drop unknown ids; put missing ids into a group "Бусад".

File: `lib/ai/reply.ts`

```ts
export async function writeReply(
  clauseText: string,
  group: { title: string; summary: string; examples: string[] }
): Promise<string>;
```

- Polite, official but simple, ≤ 100 words, **no promises** ("заавал өөрчилнө" гэхгүй).

## Task 5 — Demo data (hours 11–13)

- Collect 30–50 real comments from other hackathon participants on 2–3 clauses (use our site if Dev 3's comment page is ready, otherwise a Google Form).
- `scripts/import-comments.ts`: reads `data/comments.json` → saves via Prisma.
- Run the group step once, read the groups, make sure titles make sense.
- Give Dev 3 two numbers for the pitch: `readAmendment` accuracy, and (if mentor answers) how long manual comparison takes.

## Checkpoints

- **CP1 (hour 4):** `readAmendment` correct on the demo bill (or fallback decided).
- **CP2 (hour 8):** all 4 functions real, tested with scripts.

## Done means

- Every change in the demo bill is found and correct.
- Explanations are plain, "why" never invented.
- Groups are meaningful on real comments.
