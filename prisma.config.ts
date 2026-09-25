// Prisma 7 тохиргоо. Prisma CLI (generate, migrate) энэ файлыг уншина.
//   DATABASE_URL — апп ажиллах үеийн (pooled) холболт
//   DIRECT_URL   — (заавал биш) migrate deploy-д шууд холболт; байхгүй бол DATABASE_URL
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
