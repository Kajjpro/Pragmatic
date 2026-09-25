-- Хариу v2: өмнөх migration-ийг CLAUDE.md-ийн "Data model"-д яг тааруулна.
-- Өмнөх migration аль хэдийн ажилласан DB дээр ч, шинэ DB дээр ч аюулгүй ажиллана.

-- CreateEnum
CREATE TYPE "CardKind" AS ENUM ('BILL', 'CHANGE');

-- VoteEventStatus: DRAFT-ийг хасна (DRAFT байсан мөрийг OPEN болгоно)
UPDATE "VoteEvent" SET "status" = 'OPEN' WHERE "status" = 'DRAFT';
CREATE TYPE "VoteEventStatus_new" AS ENUM ('OPEN', 'REVEALED');
ALTER TABLE "VoteEvent" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "VoteEvent" ALTER COLUMN "status" TYPE "VoteEventStatus_new" USING ("status"::text::"VoteEventStatus_new");
ALTER TYPE "VoteEventStatus" RENAME TO "VoteEventStatus_old";
ALTER TYPE "VoteEventStatus_new" RENAME TO "VoteEventStatus";
DROP TYPE "VoteEventStatus_old";
ALTER TABLE "VoteEvent" ALTER COLUMN "status" SET DEFAULT 'OPEN';

-- VoteEvent: voteDate → closesAt
ALTER TABLE "VoteEvent" DROP COLUMN "voteDate",
ADD COLUMN     "closesAt" TIMESTAMP(3);

-- User.persona: анхдагч нь ALL, хоосон байж болохгүй
UPDATE "User" SET "persona" = 'ALL' WHERE "persona" IS NULL;
ALTER TABLE "User" ALTER COLUMN "persona" SET NOT NULL,
ALTER COLUMN "persona" SET DEFAULT 'ALL';

-- Card: хуучин title/body хэлбэрийн карт зөвхөн туршилтын өгөгдөл байж болно (seed хараахан байгаагүй).
-- Шинэ хэлбэрт (emoji, hook, before/after, youMeaning) хөрвүүлэх боломжгүй тул устгана.
DELETE FROM "Card";
DROP INDEX "Card_slug_key";
ALTER TABLE "Card" DROP COLUMN "body",
DROP COLUMN "createdAt",
DROP COLUMN "slug",
DROP COLUMN "title",
DROP COLUMN "updatedAt",
ADD COLUMN     "after" TEXT,
ADD COLUMN     "before" TEXT,
ADD COLUMN     "clauseId" TEXT,
ADD COLUMN     "emoji" TEXT NOT NULL,
ADD COLUMN     "kind" "CardKind" NOT NULL,
ADD COLUMN     "youMeaning" TEXT NOT NULL,
ALTER COLUMN "sourceUrl" SET NOT NULL;
ALTER TABLE "Card" ADD CONSTRAINT "Card_clauseId_fkey" FOREIGN KEY ("clauseId") REFERENCES "Clause"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- QuizQuestion.options: text[] → jsonb (string[])
ALTER TABLE "QuizQuestion" ALTER COLUMN "options" TYPE JSONB USING to_jsonb("options");
ALTER TABLE "QuizQuestion" ALTER COLUMN "options" SET NOT NULL;

-- CardView, QuizAnswer: мөр байгаа нь л оноо авсан гэсэн үг — pointsAwarded хэрэггүй
ALTER TABLE "CardView" DROP COLUMN "pointsAwarded";
ALTER TABLE "QuizAnswer" DROP COLUMN "pointsAwarded";

-- Prediction: pointsAwarded (null = дүн гараагүй) → points (анхдагч 0)
ALTER TABLE "Prediction" ADD COLUMN "points" INTEGER NOT NULL DEFAULT 0;
UPDATE "Prediction" SET "points" = COALESCE("pointsAwarded", 0);
ALTER TABLE "Prediction" DROP COLUMN "pointsAwarded";

-- Badge: commentId → submissionId. Хууль/заалтын нэрийг саналаас уншина.
ALTER TABLE "Badge" DROP CONSTRAINT "Badge_commentId_fkey";
ALTER TABLE "Badge" RENAME COLUMN "commentId" TO "submissionId";
ALTER TABLE "Badge" DROP COLUMN "clauseNumber",
DROP COLUMN "lawTitle";
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
