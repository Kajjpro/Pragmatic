@AGENTS.md
Хариу — Open Parliament Hackathon (shared team file)
Товчхондоо: Иргэн ба ажилтан нэг хананы хоёр талд зогсож байна — тэр хана бол ойлгоход хэцүү хуулийн төсөл. "Хариу" нь 3 алхамтай нэг урсгал: Ойлгох → Сонсох → Хариулах. (1) Хуулийн өөрчлөлтийг заалт бүрээр автоматаар харьцуулж, иргэнд энгийнээр тайлбарлана. (2) Иргэдийн саналаас хамааралгүйг шүүж, үлдсэнийг бүлэглэнэ. (3) Ажилтан хариулж, иргэн санал нь тусгагдсан эсэхийг харна. Жижиг нэмэлт функц хийхгүй. Маргааш 10:00-д питч (PITCH.md).
The final pitch script is in PITCH.md. Each dev also has a personal file: DEV1-BACKEND.md, DEV2-AI.md (AI + demo data), DEV3-FRONTEND.md (frontend + pitch). When starting Claude Code, say: "Read CLAUDE.md and DEV1-BACKEND.md (or DEV2-AI.md / DEV3-FRONTEND.md), then ..."
Context
Open Parliament Hackathon (Mongolian Parliament Secretariat / УИХТГ, The Asia Foundation, Unread).
Final presentation: tomorrow 10:00. Quality over quantity.
Mentors (parliament staff): most teams focus on citizens; we win by reducing staff's manual paper work (93.9% of the legislative process is paper-based).
Cohesion — one story
Citizens and staff stand on two sides of the same wall: a bill that is hard to understand. Once the machine understands a bill's changes, both sides benefit. "Нэг ажил, хоёр ашиг."
Step
Staff
Citizen

1. Ойлгох (Understand)
   Automatic clause-by-clause comparison, Word export
   Same changes explained plainly: what / why / who
2. Сонсох (Listen)
   AI filters irrelevant comments, groups the rest
   Their comment reaches staff organised
3. Хариулах (Respond)
   One reply per group, mark "Тусгасан / Тусгаагүй"
   "✅ Таны санал тусгагдлаа"

Problems from mentors (3 MPs + drafting consultant):
Young people don't know the parliament or even basic laws (e.g. tax law) — and don't know that they don't know. → Step 1 (plain explanation). No new feature.
Public comments contain many irrelevant / unnecessary words and ideas; staff delete them by hand. → Step 2 (filter).
A consultant handles 8–10 bills and compares every word by hand. → Step 1.
Citizens never learn if their comment was reflected. → Step 3.
The 2 core features (nothing else)
Feature 1 — Law amendment comparison (Хуулийн өөрчлөлтийн харьцуулалт)
Problem: A drafting consultant handles 8–10 bills at once. For every amendment bill they compare each clause with the current law by hand, even single-word changes (3.1 "хариуцлагатай байна" → "хариуцлагатай байж болно"), then prepare a comparison table for MPs. Solution: Staff enters current law + amendment bill → system shows clause-by-clause comparison with every changed word highlighted → staff approves → exports a Word comparison table. Same data, two views: staff (precise, source quotes, approve, Word) and citizen (same comparison + plain what / why / who explanation).
Feature 2 — "Was my comment reflected?" (Миний санал тусгагдсан уу?)
Problem: Citizens comment on bills but never get a reply or learn if anything changed. Solution: Citizen comments on a clause → AI filters irrelevant comments (never deletes — staff can restore) → AI groups the relevant ones → staff replies per group and marks "Тусгасан / Тусгаагүй" → citizen sees the result next to the clause's before/after. Extra problem solved: staff currently delete off-topic / abusive / duplicate comments by hand.
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
Citizen comments ──→ filterComments ──→ groupComments ──→ writeReply ──→ staff approves ──→ citizen sees result
└──→ "Шүүгдсэн" list (staff can restore)

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
filterComments
AI
Dev 2
Шүүх — label comments RELEVANT / OFF_TOPIC / ABUSIVE / DUPLICATE (never deletes)
groupComments
AI
Dev 2
Бүлэглэх — group similar comments (only RELEVANT)
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
type FilterStatus = "RELEVANT" | "OFF_TOPIC" | "ABUSIVE" | "DUPLICATE";
// Хамааралтай | Сэдвээс гадуур | Утгагүй/доромжилсон | Давхардсан

type FilteredCommentView = { id: string; text: string; filterStatus: FilterStatus; filterReason: string };

type BillSummary = {
id: string; title: string; stage: Stage;
changedCount: number; unapprovedCount: number; commentCount: number; unansweredGroupCount: number;
filteredCount: number;
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
filtered: FilteredCommentView[]; // staff only; empty for citizens
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
runs filterComments → groupComments (RELEVANT only) → writeReply drafts, for all clauses with new comments
POST /api/comments/[id]/restore
staff
sets a filtered comment back to RELEVANT (it joins the next grouping)
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
✅ CP2: comment → filter → group → reply → citizen sees "Тусгасан"
8–11
Sleep in shifts (3h each)
13
✅ Feature freeze. Only bug fixes, rehearsal

Fallback at CP1: if readAmendment + applyChanges are unreliable, switch to: AI returns old/new text per clause directly, compareWords only highlights.
Demo safety
AI providers can be overloaded (Gemini returned 503s during development). All AI results are precomputed with scripts/seed.ts and saved to the DB before the demo. The demo never waits on a live AI call.
lib/ai/client.ts has a fallback: Gemini → Claude on 429/503 (see DEV2-AI.md).
Keep a screen recording of the full demo as backup.
Quality bar
Real law, real bill, real comments. No fake-looking data.
Every changed word highlighted correctly.
No placeholder text, no dead buttons, everything Mongolian.
Citizen pages look good on a phone.
