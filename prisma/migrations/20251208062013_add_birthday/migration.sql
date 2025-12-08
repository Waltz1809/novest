-- AlterTable
ALTER TABLE "User" ADD COLUMN "birthday" DATETIME;

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "uploaderId" TEXT NOT NULL,
    CONSTRAINT "Novel_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Novel" ("alternativeTitles", "approvalStatus", "artist", "author", "coverImage", "createdAt", "description", "discountPercent", "id", "nation", "novelFormat", "originalName", "rejectionReason", "searchIndex", "slug", "status", "title", "updatedAt", "uploaderId", "viewCount") SELECT "alternativeTitles", "approvalStatus", "artist", "author", "coverImage", "createdAt", "description", "discountPercent", "id", "nation", "novelFormat", "originalName", "rejectionReason", "searchIndex", "slug", "status", "title", "updatedAt", "uploaderId", "viewCount" FROM "Novel";
DROP TABLE "Novel";
ALTER TABLE "new_Novel" RENAME TO "Novel";
CREATE UNIQUE INDEX "Novel_slug_key" ON "Novel"("slug");
CREATE INDEX "Novel_approvalStatus_idx" ON "Novel"("approvalStatus");
CREATE INDEX "Novel_nation_novelFormat_idx" ON "Novel"("nation", "novelFormat");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
