CREATE TYPE "Stage" AS ENUM ('DISCUSS_DECISION', 'FIRST_READING', 'FINAL_READING', 'FINAL_APPROVAL');

CREATE TYPE "ChangeType" AS ENUM ('ADDED', 'REMOVED', 'CHANGED', 'UNCHANGED');

CREATE TYPE "Reflection" AS ENUM ('PENDING', 'REFLECTED', 'NOT_REFLECTED');

CREATE TYPE "FilterStatus" AS ENUM ('RELEVANT', 'OFF_TOPIC', 'ABUSIVE', 'DUPLICATE');

ALTER TABLE "Clause" RENAME COLUMN "originalText" TO "oldText";
ALTER TABLE "Clause" ALTER COLUMN "oldText" DROP NOT NULL;
ALTER TABLE "Clause" ADD COLUMN     "applyError" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "changeType" "ChangeType" NOT NULL DEFAULT 'UNCHANGED',
ADD COLUMN     "diff" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "newText" TEXT,
ADD COLUMN     "sourceQuote" TEXT,
ADD COLUMN     "what" TEXT,
ADD COLUMN     "who" TEXT,
ADD COLUMN     "why" TEXT;

ALTER TABLE "Cluster" ADD COLUMN     "reflection" "Reflection" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "repliedAt" TIMESTAMP(3),
ADD COLUMN     "replyDraft" TEXT,
ADD COLUMN     "replyText" TEXT;

ALTER TABLE "Project" RENAME COLUMN "stage" TO "lawforumStage";
ALTER TABLE "Project" ADD COLUMN     "amendmentText" TEXT,
ADD COLUMN     "currentLawText" TEXT,
ADD COLUMN     "reasonText" TEXT,
ADD COLUMN     "stage" "Stage" NOT NULL DEFAULT 'DISCUSS_DECISION';

ALTER TABLE "Comment" ADD COLUMN     "filterReason" TEXT,
ADD COLUMN     "filterStatus" "FilterStatus",
ADD COLUMN     "restored" BOOLEAN NOT NULL DEFAULT false;
