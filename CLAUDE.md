@AGENTS.md
Хариу — Open Parliament Hackathon (shared team file)
Товчхондоо: Бид 2 л гол функц хийнэ. (1) Хуулийн өөрчлөлтийг заалт бүрээр автоматаар харьцуулах — ажилтанд. (2) Иргэний санал тусгагдсан эсэхийг харуулах. Жижиг нэмэлт функц хийхгүй. Маргааш 10:00-д питч.
Each dev also has a personal file: DEV1.md (backend), DEV2.md (AI + demo data), DEV3.md (frontend + pitch). When starting Claude Code, say: "Read CLAUDE.md and DEVx.md, then ..."
Context
Open Parliament Hackathon (Mongolian Parliament Secretariat / УИХТГ, The Asia Foundation, Unread).
Final presentation: tomorrow 10:00. Quality over quantity.
Mentors (parliament staff): most teams focus on citizens; we win by reducing staff's manual paper work (93.9% of the legislative process is paper-based).
The 2 core features (nothing else)
Feature 1 — Law amendment comparison (Хуулийн өөрчлөлтийн харьцуулалт)
Problem: A drafting consultant handles 8–10 bills at once. For every amendment bill they compare each clause with the current law by hand, even single-word changes (3.1 "хариуцлагатай байна" → "хариуцлагатай байж болно"), then prepare a comparison table for MPs. Solution: Staff enters current law + amendment bill → system shows clause-by-clause comparison with every changed word highlighted → staff approves → exports a Word comparison table. Same data, two views: staff (precise, source quotes, approve, Word) and citizen (same comparison + plain what / why / who explanation).
Feature 2 — "Was my comment reflected?" (Миний санал тусгагдсан уу?)
Problem: Citizens comment on bills but never get a reply or learn if anything changed. Solution: Citizen comments on a clause → AI groups similar comments → staff replies per group and marks "Тусгасан / Тусгаагүй" → citizen sees the result next to the clause's before/after.
Out of scope (do NOT build)
Report checker, numbering check, spelling check, ParliamentAPI, notifications, dashboards with charts, chatbots, auto-fetch from legalinfo.mn (demo law text is loaded manually).
Pipeline
Feature 1:
Current law ──→ splitIntoClauses ──┐
├──→ applyChanges ──→ compareWords ──→ staff screen (highlighted)
Amendment bill ──→ readAmendment ──┘ │
├──→ explainChange ──→ citizen screen
└──→ makeWordFile ──→ Word for MPs
Feature 2:
Citizen comments ──→ groupComments ──→ writeReply ──→ staff approves ──→ citizen sees result

All AI runs when the bill is created or when staff clicks a button, and is saved to the DB. Never call AI on page load.
Function names (fixed — do not rename)
Function
Type
Owner
Plain meaning
splitIntoClauses
code
Dev 1
Хуваах — split law text into clauses
readAmendment
AI
Dev 2
Ойлгох — turn amendment instructions into a change list
applyChanges
code
Dev 1
Засах — apply the change list to the old clauses
compareWords
code
Dev 1
Харьцуулах — word-level diff
explainChange
AI
Dev 2
Тайлбарлах — what / why / who in plain Mongolian
makeWordFile
code
Dev 1
Хэвлэх — Word comparison table
groupComments
AI
Dev 2
Бүлэглэх — group similar comments
writeReply
AI
Dev 2
Хариулах — draft staff reply for a group

Shared types (backend ↔ frontend contract)
type Stage = "DISCUSS_DECISION" | "FIRST_READING" | "FINAL_READING" | "FINAL_APPROVAL";
// Хэлэлцэх эсэх | Анхны хэлэлцүүлэг | Эцсийн хэлэлцүүлэг | Эцэслэн батлах

type ChangeType = "ADDED" | "REMOVED" | "CHANGED" | "UNCHANGED";
type Reflection = "PENDING" | "REFLECTED" | "NOT_REFLECTED"; // Хүлээгдэж буй | Тусгасан | Тусгаагүй

type WordPart = { value: string; added?: boolean; removed?: boolean }; // from the `diff` package

type BillSummary = {
id: string; title: string; stage: Stage;
changedCount: number; unapprovedCount: number; commentCount: number; unansweredGroupCount: number;
};

type GroupView = {
id: string; title: string; summary: string; commentCount: number;
replyDraft: string | null; replyText: string | null; reflection: Reflection;
};

type ClauseView = {
id: string; number: string;
oldText: string | null; newText: string | null; changeType: ChangeType;
diff: WordPart[];
sourceQuote: string | null; // exact sentence from the bill
what: string | null; why: string | null; who: string | null;
approved: boolean;
groups: GroupView[];
};

type BillDetail = { id: string; title: string; stage: Stage; reasonText: string | null; clauses: ClauseView[] };

API (Dev 1 builds, Dev 3 uses)
Route
Who
Does
GET /api/bills
all
BillSummary[]
GET /api/bills/[id]
all
BillDetail
POST /api/bills
staff
{ title, stage, currentLawText, amendmentText, reasonText } → runs Feature 1 pipeline, returns { id }
POST /api/clauses/[id]/approve
staff
marks clause approved
GET /api/bills/[id]/word
staff
downloads .docx
POST /api/comments
citizen
{ clauseId, text }
GET /api/me/comments
citizen
my comments + group + reply + reflection + clause before/after
POST /api/bills/[id]/group
staff
runs groupComments + writeReply drafts for all clauses with new comments
POST /api/groups/[id]/reply
staff
{ replyText, reflection }

Errors: { error: "монгол текст" } with proper HTTP status.
Stack
Next.js (App Router, TS), Tailwind, Prisma 7 (provider = "prisma-client", output app/generated/prisma), PostgreSQL, Clerk (CITIZEN / STAFF via STAFF_EMAILS), Gemini via @google/genai (model from GEMINI_MODEL, currently gemini-3.8-flash), diff, docx.
Code style (everyone)
Simple, readable, beginner-friendly. Every teammate must understand every line.
Short functions, clear names, comments in Mongolian for each step.
No clever abstractions, no unnecessary libraries.
All UI text in Mongolian.
File ownership
Dev 1: prisma/, lib/_.ts (non-AI), app/api/**, scripts/seed.ts
Dev 2: lib/ai/**, scripts/test-_.ts, scripts/import-comments.ts, data/
Dev 3: app/**/page.tsx, app/**/layout.tsx (except staff guard), components/\*\*, pitch/ Do not edit other people's files without telling them.
Timeline (hours from start)
Hour
Checkpoint
0–0.5
Together: pick demo law, agree on this file
4
✅ CP1: entering the bill shows a correct highlighted comparison
8
✅ CP2: comment → group → reply → citizen sees "Тусгасан"
8–11
Sleep in shifts (3h each)
13
✅ Feature freeze. Only bug fixes, rehearsal

Fallback at CP1: if readAmendment + applyChanges are unreliable, switch to: AI returns old/new text per clause directly, compareWords only highlights.
Quality bar
Real law, real bill, real comments. No fake-looking data.
Every changed word highlighted correctly.
No placeholder text, no dead buttons, everything Mongolian.
Citizen pages look good on a phone.
