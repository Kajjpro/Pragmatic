# Хариу — Vercel дээр байршуулах

Энэ баримт нь production орчныг анх удаа бэлдэх, шинэчлэх, шалгах алхмуудыг агуулна.
Нууц утгуудыг (түлхүүр, нууц үг) энд хэзээ ч бичихгүй — зөвхөн нэр, хаанаас авахыг заана.

## 1. Орчны хувьсагч (Vercel → Project → Settings → Environment Variables)

### Заавал

| Нэр | Юу вэ | Хаанаас авах |
|---|---|---|
| `DATABASE_URL` | Апп ажиллах үеийн PostgreSQL холболт. **Pooled** холболт өгнө (Neon: хостын нэрэнд `-pooler`; Supabase: 6543 порт, `pgbouncer=true`). | Өгөгдлийн сангийн үйлчилгээний хяналтын самбар |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk-ийн нийтийн түлхүүр | Clerk Dashboard → API Keys (Production instance) |
| `CLERK_SECRET_KEY` | Clerk-ийн нууц түлхүүр | Clerk Dashboard → API Keys (Production instance) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | Тогтмол утга |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | Тогтмол утга |
| `NEXT_PUBLIC_SITE_URL` | Сайтын бүтэн хаяг (OG зурагт хэрэгтэй), жишээ нь `https://hariu.vercel.app` | Vercel-ийн production домэйн |
| `STAFF_EMAILS` | Ажилтны имэйлүүд, таслалаар | Багийн шийдвэр |
| `PARLIAMENT_API_URL` | УИХ-ын ParliamentAPI-ийн үндсэн хаяг | Хакатоны зохион байгуулагч |
| `PARLIAMENT_API_USER`, `PARLIAMENT_API_PASS` | ParliamentAPI-ийн нэвтрэх нэр, нууц үг (`POST /api/login`) | Хакатоны зохион байгуулагч |

### Сонголттой

| Нэр | Юу вэ |
|---|---|
| `DIRECT_URL` | `prisma migrate deploy`-д зориулсан шууд (pooled биш) холболт. Байхгүй бол `DATABASE_URL`-ийг хэрэглэнэ. |
| `DATABASE_POOL_MAX` | Нэг функцийн холболтын дээд тоо (анхдагч 5). |
| `LAWFORUM_API_URL` | Анхдагч `https://lawforum.parliament.mn/LawForumAPI`. |
| `STAFF_EMAIL_DOMAIN` | Энэ домэйны бүх имэйл ажилтан болно. |
| `DEMO_CITIZEN_EMAIL`, `DEMO_CITIZEN_COMMENT` | Зөвхөн `npm run seed`-д: демо иргэний бүртгэл ба бодит санал. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Нэвтэрсний дараа очих хуудас (жишээ нь `/`). |

AI-ийн түлхүүрүүд (`GEMINI_API_KEY`, `ANTHROPIC_API_KEY`) Vercel дээр **шаардлагагүй**: бүх AI үр дүн
`data/precomputed.json`-д урьдчилан бэлэн. Зөвхөн ажилтан "шинэ төсөл оруулах", "бүлэглэх" товч
дарахад AI дуудагдана — тэр функц хэрэгтэй бол эдгээрийг нэмнэ.

## 2. Clerk (production)

1. Clerk Dashboard дээр **Production instance** үүсгэж, production домэйныг нэмнэ (DNS-ийн CNAME бичлэгүүдийг Clerk зааврын дагуу).
2. Google нэвтрэлтийг асааж, өөрийн Google OAuth client ID/secret-ийг оруулна (production-д Clerk-ийн хуваалцсан түлхүүр ажиллахгүй).
3. Дээрх Clerk хувьсагчдыг Vercel-д Production орчинд оруулна.

## 3. Build

Vercel автоматаар:

```
npm ci            # postinstall: prisma generate
npm run build     # prisma generate && next build
```

`app/generated/prisma` нь git-д ордоггүй, build бүрт үүснэ. **Migration build дотор ажилладаггүй.**

## 4. Нэг удаагийн алхмууд (өөрийн компьютерээс, production өгөгдлийн сан руу)

```
# 1. Хүснэгтүүд (зөвхөн шинэ migration нэмэгдсэн үед дахин)
DATABASE_URL="<production шууд холболт>" npx prisma migrate deploy

# 2. Агуулга: data/precomputed.json → DB (AI дуудахгүй, дахин ажиллуулж болно)
DATABASE_URL="<production>" STAFF_EMAILS="..." npm run seed

# 3. УИХ-ын өгөгдөл: ParliamentAPI + LawForum → DB (асуудал, санал хураалт, хуралдаан, гишүүд, бүх төсөл,
#    идэвхтэй төсөл → /bills, тоглоомын VoteEvent). ~1 минут, дахин ажиллуулж болно (upsert).
#    Зөвхөн VoteEvent-ийг шинэчлэх бол ажилтнаар нэвтэрч POST /api/staff/vote-events/sync.
DATABASE_URL="<production>" npm run vote -- sync      # PARLIAMENT_API_* нь .env-ээс

#    DB хоосон үед /api/parliament/*, /api/drafts нь data/snapshots/-оос уншина. Snapshot-ийг шинэчлэх:
npm run discover

# 4. Бүх идэвхтэй хуулийн төсөл: LawForum → Project. АВТОМАТ: /bills анх нээгдэхэд татаж, 6 цаг тутам цаана нь шинэчилнэ.
#    Гараар хүчээр шинэчлэх бол (дахин ажиллуулж болно, давхардуулахгүй):
#    Ажилтнаар нэвтэрч /staff → «LawForum-оос шинэчлэх», эсвэл:
DATABASE_URL="<production>" npm run sync:projects
```

## 5. Production-ийг шалгах

1. `npm run smoke:pages` (өөр сайт руу: `BASE_URL=https://<домэйн> npm run smoke:pages`) — бүх хуудас 200 буцааж, гарчигтай, нийтийн API өгөгдөлтэй эсэх.
2. `BASE_URL=https://<домэйн> npm run smoke` — API-ийн хариу, эрхийн шалгалт.
3. Гараар: `/`, `/feed`, `/bills`, нэг хуулийн хуудас, `/predict`, `/me` (нэвтэрч), `/staff` (ажилтнаар).
4. Нэг тэмдгийн хуудсыг (`/b/<id>`) хуваалцах шалгагчаар (жишээ нь opengraph.xyz) нээж, монгол үсэгтэй OG зураг гарч байгааг шалгана.
5. Vercel → Logs: хуудас ачаалахад AI дуудлага (`AI хариулсан:`) гарахгүй байх ёстой.
