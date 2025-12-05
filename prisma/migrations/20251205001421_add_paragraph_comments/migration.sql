-- AlterTable
ALTER TABLE "Comment" ADD COLUMN "paragraphId" INTEGER;

-- CreateIndex
CREATE INDEX "Comment_chapterId_paragraphId_idx" ON "Comment"("chapterId", "paragraphId");
