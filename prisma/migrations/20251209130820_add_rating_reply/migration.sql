-- AlterTable
ALTER TABLE "Rating" ADD COLUMN "updatedAt" DATETIME;

-- CreateTable
CREATE TABLE "RatingReply" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ratingUserId" TEXT NOT NULL,
    "ratingNovelId" INTEGER NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "RatingReply_ratingUserId_ratingNovelId_fkey" FOREIGN KEY ("ratingUserId", "ratingNovelId") REFERENCES "Rating" ("userId", "novelId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RatingReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RatingReply_ratingUserId_ratingNovelId_idx" ON "RatingReply"("ratingUserId", "ratingNovelId");
