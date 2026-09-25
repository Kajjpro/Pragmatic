import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Vercel (serverless): DATABASE_URL-д pooled холболт (жишээ нь Neon "-pooler", Supabase 6543 порт) өгнө.
// Функц бүр цөөн холболт барина.
const adapter = new PrismaPg(
  { connectionString: process.env.DATABASE_URL, max: Number(process.env.DATABASE_POOL_MAX ?? 5) },
  process.env.DATABASE_SCHEMA ? { schema: process.env.DATABASE_SCHEMA } : undefined,
);

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
