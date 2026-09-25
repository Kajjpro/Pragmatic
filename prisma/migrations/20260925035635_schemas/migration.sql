-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CITIZEN', 'STAFF');

-- CreateEnum
CREATE TYPE "Vote" AS ENUM ('SUPPORT', 'OPPOSE', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "CommentSource" AS ENUM ('WEB', 'PAPER');

-- CreateEnum
CREATE TYPE "ClusterStatus" AS ENUM ('OPEN', 'ANSWERED');

-- CreateEnum
CREATE TYPE "ProjectSource" AS ENUM ('LAWFORUM', 'UPLOAD');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CITIZEN',
    "committee" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "lawforumId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "projectNumber" TEXT,
    "typeTitle" TEXT,
    "categoryTitle" TEXT,
    "status" INTEGER,
    "stage" INTEGER,
    "slugUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "allowComments" BOOLEAN NOT NULL DEFAULT true,
    "lawforumStats" JSONB,
    "source" "ProjectSource" NOT NULL DEFAULT 'LAWFORUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clause" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "heading" TEXT,
    "originalText" TEXT NOT NULL,
    "plainText" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Clause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cluster" (
    "id" TEXT NOT NULL,
    "clauseId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "summary" TEXT,
    "status" "ClusterStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "clauseId" TEXT NOT NULL,
    "userId" TEXT,
    "vote" "Vote" NOT NULL DEFAULT 'NEUTRAL',
    "body" TEXT NOT NULL,
    "source" "CommentSource" NOT NULL DEFAULT 'WEB',
    "petitionerName" TEXT,
    "paperImageUrl" TEXT,
    "clusterId" TEXT,
    "suspicious" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reply" (
    "id" TEXT NOT NULL,
    "clusterId" TEXT NOT NULL,
    "aiDraft" TEXT,
    "finalText" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "replyId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_lawforumId_key" ON "Project"("lawforumId");

-- CreateIndex
CREATE INDEX "Clause_projectId_idx" ON "Clause"("projectId");

-- CreateIndex
CREATE INDEX "Cluster_clauseId_idx" ON "Cluster"("clauseId");

-- CreateIndex
CREATE INDEX "Comment_clauseId_idx" ON "Comment"("clauseId");

-- CreateIndex
CREATE INDEX "Comment_clusterId_idx" ON "Comment"("clusterId");

-- CreateIndex
CREATE UNIQUE INDEX "Reply_clusterId_key" ON "Reply"("clusterId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_userId_replyId_key" ON "Notification"("userId", "replyId");

-- AddForeignKey
ALTER TABLE "Clause" ADD CONSTRAINT "Clause_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cluster" ADD CONSTRAINT "Cluster_clauseId_fkey" FOREIGN KEY ("clauseId") REFERENCES "Clause"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_clauseId_fkey" FOREIGN KEY ("clauseId") REFERENCES "Clause"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "Cluster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "Cluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "Reply"("id") ON DELETE CASCADE ON UPDATE CASCADE;
