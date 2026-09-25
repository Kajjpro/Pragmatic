# Хариу — Open Parliament Hackathon project

## Context

- Hackathon: Open Parliament Hackathon (Mongolian Parliament Secretariat / УИХТГ, The Asia Foundation, Unread).
- **Final presentation: tomorrow 10:00.** Time is short. Quality over quantity.
- Team of 3 devs. **I am Dev 2: AI functions + demo data.**
- Mentors (parliament staff) told us: most teams focus on citizens; we win by reducing staff's manual paper work (93.9% of the legislative process is paper-based).

## Strategy: only 2 core features, make them shine

Do NOT add small extra features. Polish these two.

### Feature 1 — Law amendment comparison (Хуулийн өөрчлөлтийн харьцуулалт)

**Problem:** A drafting consultant handles 8–10 bills at once. For every amendment bill they compare each clause with the current law **by hand**, even single-word changes (e.g. 3.1 "хариуцлагатай **байна**" → "хариуцлагатай **байж болно**"), then produce a consolidated version (шигтгэл) and a comparison table for MPs.
**Solution:** Staff uploads current law + amendment bill → system produces clause-by-clause comparison with every changed word highlighted → staff approves → exports Word comparison table.
**Same data, two views:**

- Staff: precise comparison, source quote per change, "Approve", Word export.
- Citizen: same comparison + plain explanation (what / why / who is affected).

### Feature 2 — "Was my comment reflected?" (Миний санал тусгагдсан уу?)

**Problem:** Citizens comment on bills but never get a reply or learn if their comment changed anything.
**Solution:** Citizen comments on a clause → AI groups similar comments → staff replies per group and marks "Тусгасан / Тусгаагүй" (reflected / not) → citizen sees the result next to the clause's before/after.

### Out of scope (do not build)

Report checker, numbering check, spelling check, ParliamentAPI, notifications, dashboards, chatbots, auto-fetch from legalinfo.mn (demo law text is loaded manually).

## Pipeline

```
Feature 1:
  Current law ──→ splitIntoClauses ──┐
                                     ├──→ applyChanges ──→ compareWords ──→ staff screen (highlighted)
  Amendment bill ──→ readAmendment ──┘                         │
                                                               ├──→ explainChange ──→ citizen screen
                                                               └──→ makeWordFile ──→ Word for MPs
Feature 2:
  Citizen comments ──→ groupComments ──→ writeReply ──→ staff approves ──→ citizen sees result
```

## Function contracts (names are fixed — do not rename)

| Function                                      | Type   | Owner          | Meaning                                                    |
| --------------------------------------------- | ------ | -------------- | ---------------------------------------------------------- |
| `splitIntoClauses(text)`                      | code   | Dev 1          | Split law text into clauses `[{ number, text }]`           |
| `readAmendment(billText)`                     | **AI** | **Dev 2 (me)** | Understand amendment instructions → structured change list |
| `applyChanges(oldClauses, changes)`           | code   | Dev 1          | Apply the change list to the old clauses → new clauses     |
| `compareWords(oldText, newText)`              | code   | Dev 1          | Word-level diff (use the `diff` npm package)               |
| `explainChange(oldText, newText, reasonText)` | **AI** | **Dev 2 (me)** | Plain explanation: what / why / who                        |
| `makeWordFile(bill)`                          | code   | Dev 1          | Word comparison table                                      |
| `groupComments(clauseText, comments)`         | **AI** | **Dev 2 (me)** | Group similar comments                                     |
| `writeReply(clauseText, group)`               | **AI** | **Dev 2 (me)** | Draft a staff reply for a group                            |

### My AI function signatures

```ts
// lib/ai/amendment.ts
type Change = {
  action: "ADD" | "REMOVE" | "REPLACE_WORDS" | "REWRITE"; // нэмэх / хүчингүй болгох / үг солих / өөрчлөн найруулах
  clause: string;        // e.g. "3.1"
  oldWords?: string;     // REPLACE_WORDS: text being replaced
  newText?: string;      // new words (REPLACE_WORDS) or full new clause text (ADD / REWRITE)
  sourceQuote: string;   // exact sentence from the bill — MUST appear verbatim in billText
};
readAmendment(billText: string): Promise<Change[]>

// lib/ai/explain.ts
explainChange(oldText: string, newText: string, reasonText: string):
  Promise<{ what: string; why: string; who: string }>

// lib/ai/comments.ts
groupComments(clauseText: string, comments: { id: string; text: string }[]):
  Promise<{ title: string; summary: string; commentIds: string[] }[]>

// lib/ai/reply.ts
writeReply(clauseText: string, group: { title: string; summary: string; examples: string[] }):
  Promise<string>
```

### Mongolian amendment phrasings `readAmendment` must recognize

- "...гэснийг ...гэж өөрчилсүгэй" → REPLACE_WORDS
- "...дугаар зүйлийн ... дахь хэсгийг доор дурдсанаар өөрчлөн найруулсугай" → REWRITE
- "...дараах агуулгатай ... дахь хэсэг нэмсүгэй" → ADD
- "...хүчингүй болсонд тооцсугай" → REMOVE

## AI rules (always follow)

1. **Only `lib/ai/client.ts` talks to Gemini.** Every AI function calls `askGeminiJSON(prompt)`.
2. Model name comes from `.env` `GEMINI_MODEL` (currently `gemini-3.8-flash`). Never hardcode it.
3. Every AI function has a **stub mode**: if `process.env.AI_STUB === "true"`, return fake data without calling Gemini.
4. **No fabrication:**
   - `sourceQuote` must appear verbatim in the input text (`billText.includes(sourceQuote)`); drop items that fail.
   - `explainChange.why` comes ONLY from `reasonText` (the bill's explanatory note). If not there, return "Шалтгааныг төсөлд дурдаагүй."
   - `writeReply` must not promise outcomes.
5. All AI output text is in **Mongolian**, plain language (high-school level), neutral, no political opinions.
6. Validate AI output shape in code; if wrong, treat as empty rather than crash.
7. AI results are computed once and saved to the DB — never call AI on page load.

## Code style (important)

- **Keep code simple and beginner-friendly.** I want to understand every line.
- No clever abstractions, no generics gymnastics, no extra libraries unless necessary.
- Short functions, clear names, comments in Mongolian explaining each step.
- Prefer plain `for` loops and `if` statements over complex chains.

## Stack

- Next.js (App Router, TypeScript), Tailwind
- Prisma 7 (`generator client { provider = "prisma-client"; output = "../app/generated/prisma" }`), PostgreSQL
- Clerk auth (roles: CITIZEN / STAFF; staff decided by `STAFF_EMAILS` env)
- Gemini via `@google/genai`
- Existing schema naming: `Submission` = Comment, `Cluster` = Group.

## File ownership

- **Mine (Dev 2):** `lib/ai/*`, `scripts/*`, demo data.
- Dev 1: `prisma/`, `lib/*.ts` (non-AI), `app/api/*`.
- Dev 3: `app/**/page.tsx`, `components/*`, pitch.
- Do not edit other devs' files unless I explicitly ask.

## Current status

- `lib/ai/client.ts` — done (`askGeminiJSON`, retries only on 429/503).
- `lib/ai/review.ts` — from the dropped report-checker idea; can be deleted.
- Next: stubs for all 4 functions → real `readAmendment` (highest priority) → `explainChange` → `groupComments` → `writeReply`.

## Testing

- Test scripts in `scripts/test-*.ts`, run with: `npx tsx --env-file=.env scripts/test-xxx.ts`
- `readAmendment` must be checked by hand on every clause of the real demo bill. Record accuracy (e.g. "19/20 correct") for the pitch — use real measured numbers only.

## Demo data (my job)

- One real law: current text (legalinfo.mn) + its amendment bill (lawforum.parliament.mn) + the bill's explanatory note. Prefer a bill with a tiny word change like "байна → байж болно".
- 30–50 real citizen comments written by other hackathon participants.

## Quality bar

- Every changed word highlighted correctly on the real bill.
- AI results precomputed; no waiting during the demo.
- No placeholder text, everything in Mongolian, no dead
