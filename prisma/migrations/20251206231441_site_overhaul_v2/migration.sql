/*
  Warnings:

  - You are about to drop the column `type` on the `Ticket` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "ChapterVersion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chapterId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "ChapterVersion_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Chapter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" REAL NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "price" INTEGER NOT NULL DEFAULT 0,
    "volumeId" INTEGER NOT NULL,
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "publishAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Chapter_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "Volume" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Chapter" ("content", "createdAt", "id", "isLocked", "order", "price", "slug", "title", "volumeId", "wordCount") SELECT "content", "createdAt", "id", "isLocked", "order", "price", "slug", "title", "volumeId", "wordCount" FROM "Chapter";
DROP TABLE "Chapter";
ALTER TABLE "new_Chapter" RENAME TO "Chapter";
CREATE UNIQUE INDEX "Chapter_slug_key" ON "Chapter"("slug");
CREATE INDEX "Chapter_isDraft_publishAt_idx" ON "Chapter"("isDraft", "publishAt");
CREATE TABLE "new_Novel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "artist" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ONGOING',
    "coverImage" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "alternativeTitles" TEXT,
    "originalName" TEXT,
    "searchIndex" TEXT,
    "nation" TEXT NOT NULL DEFAULT 'CN',
    "novelFormat" TEXT NOT NULL DEFAULT 'WN',
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "uploaderId" TEXT NOT NULL,
    CONSTRAINT "Novel_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Novel" ("alternativeTitles", "author", "coverImage", "createdAt", "description", "id", "searchIndex", "slug", "status", "title", "updatedAt", "uploaderId", "viewCount") SELECT "alternativeTitles", "author", "coverImage", "createdAt", "description", "id", "searchIndex", "slug", "status", "title", "updatedAt", "uploaderId", "viewCount" FROM "Novel";
DROP TABLE "Novel";
ALTER TABLE "new_Novel" RENAME TO "Novel";
CREATE UNIQUE INDEX "Novel_slug_key" ON "Novel"("slug");
CREATE INDEX "Novel_approvalStatus_idx" ON "Novel"("approvalStatus");
CREATE INDEX "Novel_nation_novelFormat_idx" ON "Novel"("nation", "novelFormat");
CREATE TABLE "new_Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mainType" TEXT NOT NULL DEFAULT 'BUG',
    "subType" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "chapterId" INTEGER,
    "novelId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Ticket_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Ticket" ("createdAt", "description", "id", "status", "title", "updatedAt", "userId") SELECT "createdAt", "description", "id", "status", "title", "updatedAt", "userId" FROM "Ticket";
DROP TABLE "Ticket";
ALTER TABLE "new_Ticket" RENAME TO "Ticket";
CREATE INDEX "Ticket_mainType_status_idx" ON "Ticket"("mainType", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ChapterVersion_chapterId_idx" ON "ChapterVersion"("chapterId");

-- CreateIndex
CREATE INDEX "ChapterVersion_expiresAt_idx" ON "ChapterVersion"("expiresAt");
