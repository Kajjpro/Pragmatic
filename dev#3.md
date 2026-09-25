DEV 3 — Frontend + pitch
Товчхондоо: Чи бүх дэлгэцийг хийнэ: ажилтны харьцуулалтын ширээ, иргэний хуулийн хуудас, "Миний санал" хуудас. Мөн питч, демогийн скриптийг хариуцна. Шүүгчид харж байгаа бүх зүйл чиний гараар гарна — гялалзах ёстой.
Read CLAUDE.md first (shared types + API list). Until Dev 1's API is ready, use mock data typed with the shared types (lib/mock.ts).
Your files
app/**/page.tsx, components/**, lib/mock.ts, pitch/
Design rules
Clean, calm, trustworthy (government), lots of white space. One accent color.
Font with good Cyrillic support (e.g. Inter or Noto Sans via next/font).
Diff colors: removed word = red background + strikethrough, added word = green background.
Staff pages: desktop first. Citizen pages: phone first (test at 375px width).
Every page has loading, empty and error states. No dead buttons. All text Mongolian.
Components (components/)
Component
What it shows
StageBar
4 stages: Хэлэлцэх эсэх → Анхны хэлэлцүүлэг → Эцсийн хэлэлцүүлэг → Эцэслэн батлах. Current one highlighted. On FIRST_READING / FINAL_READING show badge "Санал өгөх үе".
DiffText
Renders WordPart[] with red/green highlights
ChangeBadge
Нэмсэн / Хассан / Өөрчилсөн (color per type)
ClauseCompare
Two columns: "Хүчин төгөлдөр" | "Төсөл", using DiffText. On phone: stacked.
ChangeExplain
Three rows: Юу өөрчлөгдсөн, Яагаад, Хэнд нөлөөлөх
CommentForm
Textarea + "Санал илгээх" (requires login)
GroupCard
Group title, comment count, summary, reply, ReflectionBadge
ReflectionBadge
✅ Тусгасан / ❌ Тусгаагүй / ⏳ Хүлээгдэж буй
BillCard
Title, StageBar (small), counts

Staff pages
/staff — Миний төслүүд (hours 11–13, simple)
List of BillCards: title, stage, "N өөрчлөлт шалгах", "N бүлэг хариулаагүй".
Button "Шинэ төсөл оруулах" → form: title, stage, 3 textareas (Хүчин төгөлдөр хууль / Төсөл / Танилцуулга) → POST /api/bills → show a clear loading state ("Харьцуулж байна…") → go to the bill page.
/staff/bills/[id] — Ажлын ширээ (hours 0.5–4) — MAIN DEMO SCREEN
Top: title, StageBar, counters (өөрчлөгдсөн заалт, батлагдаагүй), button "Word татах" (GET /api/bills/[id]/word). Tab 1 "Харьцуулалт":
Filter chips: Бүгд / Нэмсэн / Хассан / Өөрчилсөн.
Each changed clause: number, ChangeBadge, ClauseCompare, small grey "Эх сурвалж: …" with sourceQuote, button "Батлах" (→ turns into ✓ Батлагдсан).
If a clause has an apply error, show a red warning "Автоматаар оруулж чадсангүй — гараар шалгана уу".
Keyboard: ↑/↓ move between clauses, A approve. (Nice for demo: "ажилтан хурдан шалгана".) Tab 2 "Иргэдийн санал":
Button "Санал бүлэглэх" (POST /api/bills/[id]/group) with loading state.
Per clause: its GroupCards. Each has textarea prefilled with replyDraft, buttons "Тусгасан" / "Тусгаагүй" → POST /api/groups/[id]/reply.
Citizen pages
/ — Нүүр (hours 4–8)
Short hero: "Хууль юу болж өөрчлөгдөж байгааг ойлгож, саналаа хэлээрэй."
List of BillCards.
/bills/[id] — Нэг хууль (hours 4–8) — SECOND DEMO SCREEN (on a phone)
Title, StageBar.
Only changed clauses. Each: number, ChangeBadge, ClauseCompare, ChangeExplain.
Under each: groups with replies + ReflectionBadge, then CommentForm.
Show only approved clauses to citizens (staff approval first).
/me — Миний санал (hours 6–8)
My comments: clause number, my text, group title, reply, ReflectionBadge, and the clause before/after (DiffText).
If reflected: big "✅ Таны санал тусгагдлаа".
Pitch (hours 11–15) — pitch/
6 slides:
Асуудал: 93.9% of the process is paper-based; one consultant handles 8–10 bills; compares every word by hand; citizens never hear back.
Шийдэл: two features, one system ("Нэг ажил, хоёр ашиг").
Демо (live).
AI ба код: AI understands & explains; code compares words (must be 100% exact); human approves. (Matches УИХТГ's own rule: "AI санал болгоно, хүн шийднэ".)
Үр дүн: Dev 2's real accuracy number + mentor's real time estimate (never invent numbers).
Дараагийн шат: legalinfo auto-fetch, numbering check, spelling/terminology check, report checker.
Demo script (3 min)
Staff (90s): "Зөвлөх нэг дор 10 төсөлтэй." Open the bill → full comparison appears → point at "байна → байж болно" → "Ганц үгийн өөрчлөлтийг ч алдахгүй" → "Word татах".
Citizen on phone (90s): same change with plain explanation → "40 оролцогч санал өгсөн, AI 3 бүлэг болгосон" → staff clicks "Тусгасан" → phone shows "✅ Таны санал тусгагдлаа".
Close: "Зөвлөхийн гар ажлыг систем хийнэ. Тэр ажлаас иргэд хуулиа ойлгож, санал нь тусгагдсан эсэхийг харна."
Rehearse at least twice. Have a screen recording as backup in case Wi-Fi fails.
Also your job
Ask the mentor for a sample official comparison table (харьцуулсан хүснэгт) → give to Dev 1 for makeWordFile.
If possible, show the staff screen to consultant Анар-Эрдэнэ in the morning and ask what to fix. Quote them in the pitch only with permission and their real words.
Checkpoints
CP1 (hour 4): staff comparison tab works with mock data, then with real API.
CP2 (hour 8): citizen bill page + comment + /me work on a phone.
Done means
Staff screen looks professional on a projector.
Citizen pages look great on a phone.
The "✅ Таны санал тусгагдлаа" moment works live.
