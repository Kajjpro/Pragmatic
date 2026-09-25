-- CreateEnum
CREATE TYPE "BillStage" AS ENUM ('DISCUSS_DECISION', 'FIRST_READING', 'FINAL_READING', 'FINAL_APPROVAL');

-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('ADDED', 'REMOVED', 'CHANGED', 'UNCHANGED');

-- CreateEnum
CREATE TYPE "FilterStatus" AS ENUM ('RELEVANT', 'OFF_TOPIC', 'ABUSIVE', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "Reflection" AS ENUM ('PENDING', 'REFLECTED', 'NOT_REFLECTED');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "amendmentText" TEXT,
ADD COLUMN     "billStage" "BillStage",
ADD COLUMN     "currentLawText" TEXT,
ADD COLUMN     "reasonText" TEXT;

-- AlterTable
ALTER TABLE "Clause" ADD COLUMN     "applyError" TEXT,
ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "changeType" "ChangeType" NOT NULL DEFAULT 'UNCHANGED',
ADD COLUMN     "diff" JSONB,
ADD COLUMN     "newText" TEXT,
ADD COLUMN     "oldText" TEXT,
ADD COLUMN     "sourceQuote" TEXT,
ADD COLUMN     "what" TEXT,
ADD COLUMN     "who" TEXT,
ADD COLUMN     "why" TEXT;

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "filterReason" TEXT,
ADD COLUMN     "filterStatus" "FilterStatus" NOT NULL DEFAULT 'RELEVANT',
ADD COLUMN     "filteredAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Reply" ADD COLUMN     "reflection" "Reflection" NOT NULL DEFAULT 'PENDING';
