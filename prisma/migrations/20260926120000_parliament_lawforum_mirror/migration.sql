-- УИХ-ын ParliamentAPI, LawForum-ын өгөгдлийн хуулбар (npm run vote -- sync). Зөвхөн шинэ хүснэгт нэмнэ — одоо байгаа өгөгдөлд хүрэхгүй.
-- CreateTable
CREATE TABLE "ParliamentAgenda" (
    "agendaCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "lastVotedAt" TIMESTAMP(3),
    "finalVoteId" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParliamentAgenda_pkey" PRIMARY KEY ("agendaCode")
);

-- CreateTable
CREATE TABLE "ParliamentVote" (
    "id" TEXT NOT NULL,
    "agendaCode" TEXT NOT NULL,
    "customId" TEXT NOT NULL,
    "meetingId" INTEGER,
    "name" TEXT NOT NULL,
    "voteType" TEXT NOT NULL,
    "support" INTEGER NOT NULL,
    "oppose" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "present" INTEGER,
    "votedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParliamentVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParliamentMeeting" (
    "id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParliamentMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParliamentMember" (
    "key" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "data" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParliamentMember_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "LawDraft" (
    "id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "projectNumber" TEXT,
    "typeId" INTEGER,
    "typeTitle" TEXT,
    "categoryId" INTEGER,
    "categoryTitle" TEXT,
    "status" INTEGER,
    "stage" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LawDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParliamentAgenda_lastVotedAt_idx" ON "ParliamentAgenda"("lastVotedAt");

-- CreateIndex
CREATE INDEX "ParliamentVote_meetingId_idx" ON "ParliamentVote"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "ParliamentVote_agendaCode_customId_key" ON "ParliamentVote"("agendaCode", "customId");

-- CreateIndex
CREATE INDEX "ParliamentMeeting_startsAt_idx" ON "ParliamentMeeting"("startsAt");

-- CreateIndex
CREATE INDEX "LawDraft_publishedAt_idx" ON "LawDraft"("publishedAt");

-- AddForeignKey
ALTER TABLE "ParliamentVote" ADD CONSTRAINT "ParliamentVote_agendaCode_fkey" FOREIGN KEY ("agendaCode") REFERENCES "ParliamentAgenda"("agendaCode") ON DELETE CASCADE ON UPDATE CASCADE;

