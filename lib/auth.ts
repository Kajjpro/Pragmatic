import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "./prisma";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

// Clerk-ээр нэвтэрсэн хэрэглэгчийг DB-ээс авна. Анх удаа бол үүсгэнэ (webhook хэрэггүй).
// Ажилтан эсэхийг имэйлээр тодорхойлно.
// .env: STAFF_EMAILS=a@gmail.com,b@gmail.com   (эсвэл) STAFF_EMAIL_DOMAIN=parliament.mn
function isStaffEmail(email?: string | null) {
  if (!email) return false;
  const e = email.toLowerCase();
  const list = (process.env.STAFF_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const domain = process.env.STAFF_EMAIL_DOMAIN?.toLowerCase();
  return list.includes(e) || (!!domain && e.endsWith("@" + domain));
}

export async function getUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (existing) {
    // Жагсаалтад дараа нэмэгдсэн бол ажилтан болгоно
    if (existing.role === "CITIZEN" && isStaffEmail(existing.email)) {
      return prisma.user.update({
        where: { id: existing.id },
        data: { role: "STAFF" },
      });
    }
    return existing;
  }

  const cu = await currentUser();
  const email =
    cu?.primaryEmailAddress?.emailAddress ??
    cu?.emailAddresses[0]?.emailAddress ??
    null;
  const name = [cu?.firstName, cu?.lastName].filter(Boolean).join(" ") || null;

  // scripts/seed.ts демо бүртгэлийг "seed:<имэйл>" id-тай үүсгэдэг.
  // Тэр имэйлээр (Clerk баталгаажуулсан) анх нэвтрэхэд тэр мөрийг өөрийнх болгоно — оноо, санал нь хадгалагдана.
  if (email) {
    const seeded = await prisma.user.findFirst({
      where: { clerkId: { startsWith: "seed:" }, email: { equals: email, mode: "insensitive" } },
    });
    if (seeded) {
      return prisma.user.update({
        where: { id: seeded.id },
        data: {
          clerkId: userId,
          name: seeded.name ?? name,
          role: seeded.role === "STAFF" || isStaffEmail(email) ? "STAFF" : "CITIZEN",
        },
      });
    }
  }

  return prisma.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: {
      clerkId: userId,
      name,
      email,
      role: isStaffEmail(email) ? "STAFF" : "CITIZEN",
    },
  });
}

export async function requireUser() {
  const user = await getUser();
  if (!user) throw new HttpError(401, "Нэвтрэх шаардлагатай");
  return user;
}

export async function requireStaff() {
  const user = await requireUser();
  if (user.role !== "STAFF")
    throw new HttpError(403, "Зөвхөн ажилтанд зөвшөөрөгдөнө");
  return user;
}

export function handleError(e: unknown) {
  if (e instanceof HttpError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  console.error(e);
  return NextResponse.json({ error: "Серверийн алдаа" }, { status: 500 });
}
