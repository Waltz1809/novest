/*
  Warnings:

  - You are about to drop the column `ratingNovelId` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `ratingUserId` on the `Comment` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "RatingComment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ratingUserId" TEXT NOT NULL,
    "ratingNovelId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "RatingComment_ratingUserId_ratingNovelId_fkey" FOREIGN KEY ("ratingUserId", "ratingNovelId") REFERENCES "Rating" ("userId", "novelId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RatingComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "targetType" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "AdminLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Comment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "pinnedAt" DATETIME,
    "pinnedBy" TEXT,
    "userId" TEXT NOT NULL,
    "novelId" INTEGER NOT NULL,
    "chapterId" INTEGER,
    "paragraphId" INTEGER,
    "parentId" INTEGER,
    CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("chapterId", "content", "createdAt", "id", "isPinned", "novelId", "paragraphId", "parentId", "pinnedAt", "pinnedBy", "updatedAt", "userId") SELECT "chapterId", "content", "createdAt", "id", "isPinned", "novelId", "paragraphId", "parentId", "pinnedAt", "pinnedBy", "updatedAt", "userId" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
CREATE INDEX "Comment_chapterId_paragraphId_idx" ON "Comment"("chapterId", "paragraphId");
CREATE INDEX "Comment_novelId_isPinned_idx" ON "Comment"("novelId", "isPinned");
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
    "rejectionCount" INTEGER NOT NULL DEFAULT 0,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "isR18" BOOLEAN NOT NULL DEFAULT false,
    "isLicensedDrop" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "uploaderId" TEXT NOT NULL,
    CONSTRAINT "Novel_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Novel" ("alternativeTitles", "approvalStatus", "artist", "author", "coverImage", "createdAt", "description", "discountPercent", "id", "isR18", "nation", "novelFormat", "originalName", "rejectionCount", "rejectionReason", "searchIndex", "slug", "status", "title", "updatedAt", "uploaderId", "viewCount") SELECT "alternativeTitles", "approvalStatus", "artist", "author", "coverImage", "createdAt", "description", "discountPercent", "id", "isR18", "nation", "novelFormat", "originalName", "rejectionCount", "rejectionReason", "searchIndex", "slug", "status", "title", "updatedAt", "uploaderId", "viewCount" FROM "Novel";
DROP TABLE "Novel";
ALTER TABLE "new_Novel" RENAME TO "Novel";
CREATE UNIQUE INDEX "Novel_slug_key" ON "Novel"("slug");
CREATE INDEX "Novel_approvalStatus_idx" ON "Novel"("approvalStatus");
CREATE INDEX "Novel_nation_novelFormat_idx" ON "Novel"("nation", "novelFormat");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "RatingComment_ratingUserId_ratingNovelId_idx" ON "RatingComment"("ratingUserId", "ratingNovelId");

-- CreateIndex
CREATE INDEX "AdminLog_createdAt_idx" ON "AdminLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminLog_action_idx" ON "AdminLog"("action");
