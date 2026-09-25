-- CreateEnum
CREATE TYPE "Persona" AS ENUM ('STUDENT', 'DRIVER', 'WORKER', 'PARENT', 'ALL');

-- CreateEnum
CREATE TYPE "VoteEventStatus" AS ENUM ('DRAFT', 'OPEN', 'REVEALED');

-- CreateEnum
CREATE TYPE "BadgeType" AS ENUM ('STREAK_7', 'FIRST_PREDICTION', 'LAW_CHANGER');

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "relevantPoints" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "link" TEXT,
ADD COLUMN     "text" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "replyId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "agendaCode" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastActiveDate" DATE,
ADD COLUMN     "persona" "Persona",
ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "streak" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "hook" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "personas" "Persona"[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceUrl" TEXT,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "correctIndex" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAnswer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "chosenIndex" INTEGER NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoteEvent" (
    "id" TEXT NOT NULL,
    "agendaCode" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "hook" TEXT NOT NULL,
    "status" "VoteEventStatus" NOT NULL DEFAULT 'DRAFT',
    "isReplay" BOOLEAN NOT NULL DEFAULT false,
    "voteDate" TIMESTAMP(3),
    "hiddenSupport" INTEGER,
    "hiddenOppose" INTEGER,
    "hiddenTotal" INTEGER,
    "actualSupport" INTEGER,
    "actualOppose" INTEGER,
    "actualTotal" INTEGER,
    "passed" BOOLEAN,
    "revealedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoteEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "voteEventId" TEXT NOT NULL,
    "willPass" BOOLEAN NOT NULL,
    "supportGuess" INTEGER NOT NULL,
    "pointsAwarded" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "BadgeType" NOT NULL,
    "commentId" TEXT,
    "lawTitle" TEXT,
    "clauseNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Card_slug_key" ON "Card"("slug");

-- CreateIndex
CREATE INDEX "Card_order_publishedAt_idx" ON "Card"("order", "publishedAt");

-- CreateIndex
CREATE INDEX "QuizQuestion_cardId_idx" ON "QuizQuestion"("cardId");

-- CreateIndex
CREATE INDEX "CardView_cardId_idx" ON "CardView"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "CardView_userId_cardId_day_key" ON "CardView"("userId", "cardId", "day");

-- CreateIndex
CREATE INDEX "QuizAnswer_questionId_idx" ON "QuizAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuizAnswer_userId_questionId_key" ON "QuizAnswer"("userId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "VoteEvent_agendaCode_key" ON "VoteEvent"("agendaCode");

-- CreateIndex
CREATE INDEX "VoteEvent_status_idx" ON "VoteEvent"("status");

-- CreateIndex
CREATE INDEX "Prediction_voteEventId_idx" ON "Prediction"("voteEventId");

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_userId_voteEventId_key" ON "Prediction"("userId", "voteEventId");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_key_key" ON "Badge"("key");

-- CreateIndex
CREATE INDEX "Badge_userId_idx" ON "Badge"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Project_agendaCode_key" ON "Project"("agendaCode");

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardView" ADD CONSTRAINT "CardView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardView" ADD CONSTRAINT "CardView_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteEvent" ADD CONSTRAINT "VoteEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_voteEventId_fkey" FOREIGN KEY ("voteEventId") REFERENCES "VoteEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

