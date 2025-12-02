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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Chapter_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "Volume" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Chapter" ("content", "id", "isLocked", "order", "price", "slug", "title", "volumeId") SELECT "content", "id", "isLocked", "order", "price", "slug", "title", "volumeId" FROM "Chapter";
DROP TABLE "Chapter";
ALTER TABLE "new_Chapter" RENAME TO "Chapter";
CREATE UNIQUE INDEX "Chapter_slug_key" ON "Chapter"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
