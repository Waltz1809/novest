/*
  Warnings:

  - You are about to drop the `RatingReply` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "RatingReply_ratingUserId_ratingNovelId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "RatingReply";
PRAGMA foreign_keys=on;

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
    "ratingUserId" TEXT,
    "ratingNovelId" INTEGER,
    "parentId" INTEGER,
    CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_ratingUserId_ratingNovelId_fkey" FOREIGN KEY ("ratingUserId", "ratingNovelId") REFERENCES "Rating" ("userId", "novelId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("chapterId", "content", "createdAt", "id", "isPinned", "novelId", "paragraphId", "parentId", "pinnedAt", "pinnedBy", "updatedAt", "userId") SELECT "chapterId", "content", "createdAt", "id", "isPinned", "novelId", "paragraphId", "parentId", "pinnedAt", "pinnedBy", "updatedAt", "userId" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
CREATE INDEX "Comment_chapterId_paragraphId_idx" ON "Comment"("chapterId", "paragraphId");
CREATE INDEX "Comment_novelId_isPinned_idx" ON "Comment"("novelId", "isPinned");
CREATE INDEX "Comment_ratingUserId_ratingNovelId_idx" ON "Comment"("ratingUserId", "ratingNovelId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
