Хариу v2 — Залуучуудыг УИХ-тай өдөр бүр холбох платформ
Товчхондоо: Бид 12-р ангийн сурагчид. Хакатонд бүртгүүлэх хүртлээ УИХ-ын платформ байдгийг мэдээгүй. Хэрэгсэл хийхэд хялбар — хэрэглэгч олоход хэцүү. Бусад баг хэрэгсэл хийж байна; бид тэр хэрэгслийг ашиглах хүмүүсийг бий болгоно. Хуулийг 60 секундийн карт, таамгийн тоглоом, бодит нөлөөний тэмдгээр залуучуудын өдөр тутмын дадал болгоно. Өмнө хийсэн харьцуулалт, санал бүлэглэх AI нь ард нь хөдөлгүүр болж ажиллана.
Final pitch: tomorrow 10:00. Feature freeze: 06:00. This is the production version — every screen a judge sees must be polished.
The one-line pitch
"Хууль 60 секундэд. Таамагла. Өөрчил." — Parliament becomes a daily habit for young Mongolians, and their voice reaches parliament staff organised.
The habit loop (this is the product)
① Өнөөдрийн хууль (understand) → ② Таамаг (predict the vote) → ⑥ Би хууль өөрчилсөн (real impact)
60-sec cards + quiz + streak points when the real vote happens comment reflected → badge → share
↑ │
└──────────────────────────── friends see the share, join ─────────────────────┘

Judge journey (build in this order of impression)
Hook — landing page / (first 10 seconds): full-screen, bold, one question: "Та УИХ-ыг хэдэн настайдаа анх мэдсэн бэ?" then our honest story ("Бид 17 настай. Өчигдөр л мэдсэн.") and one big button "60 секундэд нэг хууль →". A live phone mockup shows a card swiping.
Discover — /feed: pick "Би хэн бэ?" (Сурагч / Жолооч / Ажил хийдэг / Эцэг эх) → swipe cards → quiz → streak/points animate.
Play — /predict: predict a vote → reveal with animation → points.
Impact — /me + /b/[id]: "✅ Таны санал тусгагдлаа" → badge "Хууль өөрчилсөн иргэн" → shareable image.
Engine — /staff (30 seconds in the pitch): the comparison + filtered/grouped comments + reply that makes ⑥ possible. Shows we are not "just a citizen app".
Features
① Өнөөдрийн хууль — 60-second law cards
Problem: Young people don't know parliament or even basic laws (tax law) — and don't know that they don't know (MP mentors). Laws are long and written in legal language. Solution: Swipeable cards (Stories/TikTok style). One card = one bill or one change: hook title → "Одоо / Болох нь" → "Чамд юу гэсэн үг вэ" → 3-question quiz. Persona filter. Daily streak. Reuses: comparison data (before/after), explainChange → teen version.
② Таамаг — vote prediction game
Problem: Nobody follows what parliament does; there is no reason to come back. Solution: Before/around a vote: "Батлагдах уу?" (Yes/No) + "Хэдэн гишүүн дэмжих вэ?" (slider). When the real result arrives (ParliamentAPI getAgendaVoteList), reveal with animation and award points.
Replay events (past votes) are allowed for the demo but must be clearly labelled "Өмнө болсон санал хураалт — дахин тоглох".
Neutrality: never rank, praise or criticise MPs or parties. Only pass/fail and counts. No "which MP is like you".
⑥ Би хууль өөрчилсөн — real impact badge
Problem: Citizens comment but never learn if it mattered. Solution: Existing loop: comment → AI filter (off-topic/abusive/duplicate, never deleted) → AI groups → staff reply → "Тусгасан". When reflected: notification, +50 points, badge "Хууль өөрчилсөн иргэн", public badge page /b/[id] with a share image (Open Graph). Reuses: filterComments, groupComments, writeReply, staff reply flow.
Out of scope (pitch slide "Дараагийн шат" only)
School league (Сургуулийн лиг) — show as a mockup image in the pitch, do not build. No report checker, no numbering/spelling check, no chatbot, no leaderboard pages beyond what's listed.
Architecture
Next.js App Router (TS), Tailwind, framer-motion for animations, Prisma 7 + PostgreSQL, Clerk (Google sign-in), Gemini via lib/ai/client.ts (model chain in .env), diff, next/og for share images.
Browsing is public. Login only to save progress (points, streak, predictions, comments). Never block the first card behind login.
All AI output is precomputed by scripts/seed.ts and stored in the DB. No AI call ever happens on page load or during the demo.
Data model (Dev 1 owns prisma/schema.prisma)
Keep (existing): User, Project (= Law/Bill), Clause, Submission (= Comment, with filterStatus/filterReason/restored), Cluster (= Group), Reply, Notification. Delete: Report, ReportRow, Flag, Directive, Follow, old VoteResult and their enums. Add:
User.persona enum STUDENT | DRIVER | WORKER | PARENT | ALL (default ALL), User.points Int @default(0), User.streak Int @default(0), User.lastActiveDate DateTime?
Card: id, projectId?, clauseId?, kind BILL | CHANGE, emoji, hook (≤ 60 chars), before?, after?, youMeaning (teen explanation), personas Persona[], sourceUrl, order, publishedAt
QuizQuestion: id, cardId, question, options Json (string[3–4]), correctIndex, explanation
CardView: userId, cardId, day (date) — unique(userId, cardId, day)
QuizAnswer: userId, questionId, chosenIndex, correct — unique(userId, questionId)
VoteEvent: id, projectId?, agendaCode, title, hook, isReplay Boolean, status OPEN | REVEALED, closesAt?, actualSupport?, actualOppose?, actualTotal?, passed?, revealedAt?
Prediction: userId, voteEventId, willPass Boolean, supportGuess Int, points Int @default(0) — unique(userId, voteEventId)
Badge: id, userId, type LAW_CHANGER | STREAK_7 | FIRST_PREDICTION, submissionId?, createdAt
Points (Dev 1 implements in lib/points.ts, one place only)
Action
Points
First view of a card today
+1
Correct quiz answer (first try only)
+3
Prediction pass/fail correct
+10
Prediction support count within ±3 / ±8 / ±15
+10 / +5 / +2
Comment labelled RELEVANT
+2
Comment reflected (Тусгасан)
+50 + LAW_CHANGER badge
Streak: +1 when the user views ≥1 card on a new consecutive day; reset if a day is missed.

API (Dev 1 builds, Dev 3 uses)
Public:
GET /api/feed?persona=STUDENT → cards with quiz (no correctIndex!), ordered
GET /api/vote-events → open + revealed events (actual numbers only when REVEALED)
GET /api/badges/[id] → public badge data; GET /api/badges/[id]/image → OG image (next/og)
existing GET /api/bills, GET /api/bills/[id] Logged in:
GET /api/me → { name, persona, points, streak, badges, predictions, comments with group/reply/reflection }
POST /api/me/persona { persona }
POST /api/cards/[id]/view
POST /api/quiz/[id]/answer { chosenIndex } → { correct, correctIndex, explanation, pointsAwarded }
POST /api/vote-events/[id]/predict { willPass, supportGuess }
existing POST /api/comments Staff:
existing bills / group / reply routes (reply with REFLECTED awards points + badge + notification)
POST /api/staff/vote-events/sync (ParliamentAPI → VoteEvent)
POST /api/staff/vote-events/[id]/reveal (fetch result, set REVEALED, score all predictions)
Errors: { error: "монгол текст" } + proper status.
AI functions (Dev 2 owns lib/ai/)
Keep: client.ts, check.ts, readAmendment, explainChange, filterComments, groupComments, writeReply. Add:
makeCard(input) → { emoji, hook, youMeaning, personas } — teen-friendly, ≤ 60-char hook, youMeaning ≤ 2 short sentences, second person ("чи"), no slang that sounds fake, neutral.
makeQuiz(cardText) → 3 questions × 3–4 options, one correct, short explanation; answers must be supported by the card text.
makeVoteHook(title, summary) → one neutral, curious question for the prediction card. Rules: only client.ts talks to the AI; stub mode (AI_STUB=true); no fabrication (answers/claims must be in the source text); plain Mongolian; neutral; wrong shape → empty.
Ownership (to avoid conflicts)
Dev 1: prisma/, lib/_.ts (non-AI: points, db, auth, parliament, lawforum, law/_), app/api/**, scripts/seed.ts, deploy.
Dev 2 (Kajusi): lib/ai/**, scripts/test-\*.ts, scripts/precompute.ts, data/**.
Dev 3: app/**/page.tsx, app/**/layout.tsx, components/**, public/**, pitch/**. Tell the team in chat before touching someone else's file. Small commits, pull often.
Design system (Dev 3)
Mobile-first for everything except /staff. Test at 375px.
Bold, youthful, credible: large type, one strong accent color, soft cards, generous spacing. Cyrillic-safe font (e.g. Inter / Manrope via next/font).
Motion with purpose: card swipe, points "+3" pop, streak flame, prediction reveal counter, badge unlock. Respect prefers-reduced-motion.
All text Mongolian. No lorem ipsum, no dead buttons, every page has loading/empty/error states.
Global rules
Simple, readable code with Mongolian comments. No clever abstractions.
Neutral and factual about politics. No MP rankings.
No invented numbers anywhere (UI or pitch). Replays labelled.
Never delete citizen comments (only label).
Timeline (from now)
When
Checkpoint
+1h
Cleanup done, new schema migrated, stubs + seed produce 10+ cards
+3h
Landing + feed + quiz + points/streak work end-to-end on real seeded data
+5h
Prediction reveal + badge + share image work; staff reply → badge works
06:00
Feature freeze. Deploy, record backup video, pitch rehearsal
