-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'REP', 'GRADUATE');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "BlessingEmailPref" AS ENUM ('EACH', 'DAILY', 'NONE');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('NEW', 'UPDATE');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- CreateEnum
CREATE TYPE "ReminderTiming" AS ENUM ('BEFORE', 'DAY', 'BOTH');

-- CreateEnum
CREATE TYPE "ArticleTopic" AS ENUM ('PREPARATIONS', 'HOME', 'FINANCE', 'RECIPES', 'NEWS');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('SENT', 'LOGGED', 'FAILED');

-- CreateTable
CREATE TABLE "Yearbook" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "hebrewYear" VARCHAR(20) NOT NULL,
    "joinCode" VARCHAR(30) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jerusalem',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Yearbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassGroup" (
    "id" TEXT NOT NULL,
    "yearbookId" TEXT NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "size" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specialization" (
    "id" TEXT NOT NULL,
    "yearbookId" TEXT NOT NULL,
    "name" VARCHAR(40) NOT NULL,
    "size" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Specialization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "yearbookId" TEXT NOT NULL,
    "classId" TEXT,
    "name" VARCHAR(30) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'GRADUATE',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "blessingEmailPref" "BlessingEmailPref" NOT NULL DEFAULT 'DAILY',
    "reminderEmails" BOOLEAN NOT NULL DEFAULT true,
    "announcementEmails" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Yeshiva" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Yeshiva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kalla" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "specializationId" TEXT NOT NULL,
    "yeshivaId" TEXT NOT NULL,
    "userId" TEXT,
    "name" VARCHAR(40) NOT NULL,
    "engagedAt" DATE NOT NULL,
    "weddingAt" DATE,
    "hallName" VARCHAR(60),
    "hallCity" VARCHAR(30),
    "hideWeddingDate" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kalla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpdateRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "type" "RequestType" NOT NULL,
    "data" JSONB NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "note" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UpdateRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kallaId" TEXT NOT NULL,
    "timing" "ReminderTiming" NOT NULL,
    "sentBeforeAt" TIMESTAMP(3),
    "sentDayAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topics" "ArticleTopic"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "unsubscribeToken" TEXT NOT NULL,
    "lastSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blessing" (
    "id" TEXT NOT NULL,
    "kallaId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" VARCHAR(500) NOT NULL,
    "color" VARCHAR(20) NOT NULL DEFAULT 'gold',
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "hiddenById" TEXT,
    "emailedAt" TIMESTAMP(3),
    "editedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Blessing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "topic" "ArticleTopic" NOT NULL,
    "body" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "yearbookId" TEXT NOT NULL,
    "classId" TEXT,
    "subject" VARCHAR(80) NOT NULL,
    "body" VARCHAR(2000) NOT NULL,
    "sentById" TEXT NOT NULL,
    "recipientsCount" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "to" VARCHAR(120) NOT NULL,
    "template" VARCHAR(40) NOT NULL,
    "subject" VARCHAR(200) NOT NULL,
    "status" "EmailStatus" NOT NULL,
    "error" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Yearbook_joinCode_key" ON "Yearbook"("joinCode");

-- CreateIndex
CREATE UNIQUE INDEX "ClassGroup_yearbookId_name_key" ON "ClassGroup"("yearbookId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Specialization_yearbookId_name_key" ON "Specialization"("yearbookId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_yearbookId_classId_idx" ON "User"("yearbookId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "Yeshiva_name_key" ON "Yeshiva"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Kalla_userId_key" ON "Kalla"("userId");

-- CreateIndex
CREATE INDEX "Kalla_weddingAt_idx" ON "Kalla"("weddingAt");

-- CreateIndex
CREATE INDEX "Kalla_yeshivaId_idx" ON "Kalla"("yeshivaId");

-- CreateIndex
CREATE INDEX "Kalla_specializationId_idx" ON "Kalla"("specializationId");

-- CreateIndex
CREATE UNIQUE INDEX "Kalla_classId_name_key" ON "Kalla"("classId", "name");

-- CreateIndex
CREATE INDEX "UpdateRequest_classId_status_idx" ON "UpdateRequest"("classId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderSubscription_userId_kallaId_key" ON "ReminderSubscription"("userId", "kallaId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscription_userId_key" ON "NewsletterSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscription_unsubscribeToken_key" ON "NewsletterSubscription"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "Blessing_kallaId_createdAt_idx" ON "Blessing"("kallaId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "EmailLog_sentAt_idx" ON "EmailLog"("sentAt");

-- AddForeignKey
ALTER TABLE "ClassGroup" ADD CONSTRAINT "ClassGroup_yearbookId_fkey" FOREIGN KEY ("yearbookId") REFERENCES "Yearbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specialization" ADD CONSTRAINT "Specialization_yearbookId_fkey" FOREIGN KEY ("yearbookId") REFERENCES "Yearbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_yearbookId_fkey" FOREIGN KEY ("yearbookId") REFERENCES "Yearbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_classId_fkey" FOREIGN KEY ("classId") REFERENCES "ClassGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kalla" ADD CONSTRAINT "Kalla_classId_fkey" FOREIGN KEY ("classId") REFERENCES "ClassGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kalla" ADD CONSTRAINT "Kalla_specializationId_fkey" FOREIGN KEY ("specializationId") REFERENCES "Specialization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kalla" ADD CONSTRAINT "Kalla_yeshivaId_fkey" FOREIGN KEY ("yeshivaId") REFERENCES "Yeshiva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kalla" ADD CONSTRAINT "Kalla_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kalla" ADD CONSTRAINT "Kalla_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kalla" ADD CONSTRAINT "Kalla_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpdateRequest" ADD CONSTRAINT "UpdateRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpdateRequest" ADD CONSTRAINT "UpdateRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpdateRequest" ADD CONSTRAINT "UpdateRequest_classId_fkey" FOREIGN KEY ("classId") REFERENCES "ClassGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderSubscription" ADD CONSTRAINT "ReminderSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderSubscription" ADD CONSTRAINT "ReminderSubscription_kallaId_fkey" FOREIGN KEY ("kallaId") REFERENCES "Kalla"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterSubscription" ADD CONSTRAINT "NewsletterSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blessing" ADD CONSTRAINT "Blessing_kallaId_fkey" FOREIGN KEY ("kallaId") REFERENCES "Kalla"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blessing" ADD CONSTRAINT "Blessing_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blessing" ADD CONSTRAINT "Blessing_hiddenById_fkey" FOREIGN KEY ("hiddenById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_yearbookId_fkey" FOREIGN KEY ("yearbookId") REFERENCES "Yearbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_classId_fkey" FOREIGN KEY ("classId") REFERENCES "ClassGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
